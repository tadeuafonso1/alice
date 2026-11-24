/**
 * Sistema de alertas sonoros sintetizados via Web Audio API.
 * Não requer arquivos de áudio externos, sem peso de rede e com latência zero.
 */

class SoundAlerts {
    private audioCtx: AudioContext | null = null;
    private enabled: boolean = true;
    private volume: number = 0.5;

    constructor() {
        try {
            const savedEnabled = localStorage.getItem('alice_sound_enabled');
            if (savedEnabled !== null) {
                this.enabled = savedEnabled === 'true';
            }
            const savedVolume = localStorage.getItem('alice_sound_volume');
            if (savedVolume !== null) {
                this.volume = parseFloat(savedVolume);
            }
        } catch {
            // Ignora falhas em SSR / localStorage
        }
    }

    private getAudioContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        try {
            localStorage.setItem('alice_sound_enabled', String(enabled));
        } catch { }
    }

    public getVolume(): number {
        return this.volume;
    }

    public setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
        try {
            localStorage.setItem('alice_sound_volume', String(this.volume));
        } catch { }
    }

    /**
     * Toca um som suave de entrada na fila (duplo acorde ascendente)
     */
    public playJoinQueue() {
        if (!this.enabled) return;
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.volume * 0.4, now);
        masterGain.connect(ctx.destination);

        // Nota 1
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(1, now + 0.03);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(now);
        osc1.stop(now + 0.25);

        // Nota 2 (mais aguda e alegre)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gain2.gain.setValueAtTime(0, now + 0.1);
        gain2.gain.linearRampToValueAtTime(1, now + 0.13);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.4);
    }

    /**
     * Toca um toque de chamada / "Sua vez de jogar!" (!proximo)
     */
    public playNextUser() {
        if (!this.enabled) return;
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.volume * 0.5, now);
        masterGain.connect(ctx.destination);

        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const noteStart = now + idx * 0.08;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);
            gain.gain.setValueAtTime(0, noteStart);
            gain.gain.linearRampToValueAtTime(1, noteStart + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(noteStart);
            osc.stop(noteStart + 0.35);
        });
    }

    /**
     * Toca um aviso de inatividade (dois bips curtos de atenção)
     */
    public playWarning() {
        if (!this.enabled) return;
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.volume * 0.45, now);
        masterGain.connect(ctx.destination);

        [0, 0.15].forEach(delay => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + delay;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, start); // A5
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(1, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(start);
            osc.stop(start + 0.1);
        });
    }
}

export const soundAlerts = new SoundAlerts();

