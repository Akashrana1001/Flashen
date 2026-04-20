import { useState, useEffect, useRef } from 'react';
import api from '../api';

/**
 * useServerWarmup
 *
 * Silently pings GET /api/health as soon as this hook mounts.
 * On Render's free tier the backend spins down after inactivity,
 * causing the first real request (login / register) to stall for
 * 30-60 seconds.  By firing this lightweight request early we eat
 * the cold-start delay while the user is still filling in their
 * credentials, so the actual auth call feels instant.
 *
 * Returns:
 *   serverStatus: 'idle' | 'warming' | 'ready' | 'slow'
 *   serverReady: boolean – true once the ping succeeded
 */
const useServerWarmup = () => {
    const [serverStatus, setServerStatus] = useState('idle');
    const [serverReady, setServerReady] = useState(false);
    const attemptRef = useRef(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        const startTime = Date.now();

        const ping = async () => {
            if (!mountedRef.current) return;

            attemptRef.current += 1;
            setServerStatus('warming');

            try {
                await api.get('/health', { timeout: 60_000 }); // 60s gives Render enough time to wake

                if (!mountedRef.current) return;

                const elapsed = Date.now() - startTime;
                // Mark as "slow" if it took more than 8 seconds – informs the UI to show a hint
                setServerStatus(elapsed > 8_000 ? 'slow' : 'ready');
                setServerReady(true);
            } catch {
                // Ignore errors – the warmup is best-effort.
                // The real auth request will surface a proper error to the user if needed.
                if (mountedRef.current) {
                    setServerStatus('ready'); // proceed anyway
                    setServerReady(true);
                }
            }
        };

        ping();

        return () => {
            mountedRef.current = false;
        };
    }, []);

    return { serverStatus, serverReady };
};

export default useServerWarmup;
