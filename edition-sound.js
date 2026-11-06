/* A single shared audio engine. Playback is requested only from user gestures. */
(() => {
  const music = window.BIRTHDAY_CONFIG?.music || {};
  const audio = document.getElementById("backgroundMusic");
  const button = document.getElementById("soundToggle");
  const label = document.getElementById("soundLabel");
  const volume = Math.max(0, Math.min(1, Number(music.volume ?? 0.3)));
  const fadeSeconds = Math.max(0, Number(music.fadeInMs ?? 2000) / 1000);
  let context, master, source, buffer, fetchController;
  let interval = 0, generation = 0, pending = false, playing = false, mode = "off";
  let offset = 0, sourceStartedAt = 0;
  let muted = false, blocked = false, nativeFade = 0;
  const voices = new Set();
  try { muted = sessionStorage.getItem("edition-muted") === "true"; } catch (_) {}
  const hint = document.createElement("button");
  hint.type = "button"; hint.className = "music-resume"; hint.hidden = true;
  hint.textContent = "点击开启音乐"; hint.setAttribute("aria-label", "点击开启音乐");
  document.body.append(hint);
  const announce = () => {
    button.setAttribute("aria-pressed", String(playing));
    button.setAttribute("aria-label", playing ? "静音" : "点击开启音乐");
    label.textContent = playing ? "Sound on" : blocked ? "点击开启音乐" : "Sound off";
    hint.hidden = !blocked || document.hidden;
    document.dispatchEvent(new CustomEvent("edition:sound", { detail: playing }));
  };
  const remember = () => { try { sessionStorage.setItem("edition-muted", String(muted)); } catch (_) {} };
  function clearPlayback() {
    clearInterval(interval); interval = 0; cancelAnimationFrame(nativeFade);
    voices.forEach(node => { try { node.stop(); } catch (_) {} node.disconnect(); }); voices.clear();
    if (source) {
      offset = (offset + Math.max(0, context.currentTime - sourceStartedAt)) % buffer.duration;
      source.onended = null; try { source.stop(); } catch (_) {} source.disconnect(); source = null;
    }
    if (master && context?.state !== "closed") { master.gain.cancelScheduledValues(context.currentTime); master.gain.setValueAtTime(0, context.currentTime); }
    audio.pause(); playing = false; mode = "off";
  }
  function stop({ user = true } = {}) {
    generation++; pending = false; fetchController?.abort(); fetchController = null;
    clearPlayback();
    if (user) { muted = true; blocked = false; remember(); }
    else blocked = !muted;
    if (context?.state === "running") context.suspend().catch(() => {});
    announce();
  }
  function ensureContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!context || context.state === "closed") {
      context = new AudioContext(); master = context.createGain(); master.gain.value = 0;
      master.connect(context.destination);
      context.onstatechange = () => {
        if (playing && context.state !== "running") stop({ user: false });
      };
    }
    return context;
  }
  function fadeTo(level) {
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(0, context.currentTime);
    master.gain.linearRampToValueAtTime(level, context.currentTime + fadeSeconds);
  }
  function playBuffer() {
    source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
    // BufferSource loops at the sample boundary with no media-element restart gap.
    source.connect(master); fadeTo(volume); sourceStartedAt = context.currentTime; source.start(0, offset);
    mode = "track"; playing = true;
  }
  function smoothLoop(decoded) {
    // Blend the tail into the head over 80 ms, avoiding clicks/silence at MP3 boundaries.
    const overlap = Math.min(Math.floor(decoded.sampleRate * 0.08), Math.floor(decoded.length / 4));
    if (overlap < 2) return decoded;
    const length = decoded.length - overlap;
    const loop = context.createBuffer(decoded.numberOfChannels, length, decoded.sampleRate);
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const input = decoded.getChannelData(channel), output = loop.getChannelData(channel);
      output.set(input.subarray(overlap));
      for (let i = 0; i < overlap; i++) {
        const mix = i / (overlap - 1);
        output[length - overlap + i] = input[decoded.length - overlap + i] * (1 - mix) + input[i] * mix;
      }
    }
    return loop;
  }
  function playAmbient() {
    const notes = [130.815, 164.815, 196, 246.94]; let index = 0;
    fadeTo(volume * 0.0933);
    const note = () => {
      if (context.state !== "running") return;
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = "sine"; oscillator.frequency.value = notes[index++ % notes.length];
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.9, context.currentTime + 1.1);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 5.2);
      oscillator.connect(gain).connect(master); oscillator.start(); oscillator.stop(context.currentTime + 5.3);
      voices.add(oscillator);
      oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    };
    note(); interval = setInterval(note, 2600); mode = "ambient"; playing = true;
  }
  async function start({ user = true } = {}) {
    if (playing || pending || document.hidden || (!user && muted)) return;
    if (user) { muted = false; remember(); }
    const token = ++generation; pending = true; blocked = false;
    const valid = () => token === generation && !document.hidden;
    try {
      const engine = ensureContext();
      if (engine) {
        // resume() is called synchronously during the click, before any fetch/decode.
        await engine.resume();
        if (!valid()) return;
        if (engine.state !== "running") throw new Error("Playback requires a tap");
        if (music.path && !buffer) {
          const request = new AbortController(); fetchController = request;
          const timeout = setTimeout(() => request.abort(), 12000);
          try {
            const response = await fetch(music.path, { signal: request.signal });
            if (!response.ok) throw new Error("Track unavailable");
            const bytes = await response.arrayBuffer();
            // Callback form also supports older iOS Safari implementations.
            const decoded = await new Promise((resolve, reject) => engine.decodeAudioData(bytes, resolve, reject));
            buffer = smoothLoop(decoded);
          } catch (error) { if (!music.useAmbientFallback) throw error; }
          finally { clearTimeout(timeout); if (fetchController === request) fetchController = null; }
        }
        if (!valid()) return;
        if (engine.state !== "running") throw new Error("Audio interrupted");
        if (buffer) playBuffer();
        else if (music.useAmbientFallback) playAmbient();
        else throw new Error("No audio available");
      } else {
        // Last-resort native playback. iOS may enforce device volume in this mode.
        audio.loop = true; audio.volume = 0;
        await audio.play();
        if (!valid()) { audio.pause(); return; }
        mode = "native"; playing = true;
        const begun = performance.now();
        const fade = now => {
          if (!valid() || audio.paused) return;
          audio.volume = volume * Math.min(1, (now - begun) / Math.max(1, fadeSeconds * 1000));
          if (now - begun < fadeSeconds * 1000) nativeFade = requestAnimationFrame(fade);
        };
        nativeFade = requestAnimationFrame(fade);
      }
    } catch (_) {
      if (valid()) { clearPlayback(); blocked = true; }
    } finally {
      if (token === generation) { pending = false; announce(); }
    }
  }
  const toggle = () => playing || pending ? stop() : start();
  window.editionSound = { start, stop, toggle, isPlaying: () => playing,
    getState: () => ({ playing, pending, muted, blocked, mode, volume }) };
  button.hidden = !(music.path || music.useAmbientFallback);
  if (music.path) audio.src = music.path;
  button.addEventListener("click", toggle); hint.addEventListener("click", () => start());
  if (music.autoplayOnOpen) document.getElementById("openEdition").addEventListener("click", () => start({ user: false }));
  audio.addEventListener("pause", () => { if (mode === "native" && playing) stop({ user: false }); });
  audio.addEventListener("error", () => { if (mode === "native") stop({ user: false }); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop({ user: false });
    else announce(); // A fresh tap is required after returning.
  });
  window.addEventListener("pagehide", () => stop({ user: false }));
  announce();
})();
