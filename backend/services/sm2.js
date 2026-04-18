// SM-2 Mathematical Engine implementation
// q: User performance grade (0-5, where >=3 is a pass in typical implementation)
// Returns updated SM-2 properties

export function calculateSM2(q, repetitions, previousInterval, easeFactor) {
    let I, R, EF;

    if (q >= 3) {
        if (repetitions === 0) {
            I = 1;
        } else if (repetitions === 1) {
            I = 6;
        } else {
            I = Math.round(previousInterval * easeFactor);
        }
        R = repetitions + 1;
    } else {
        R = 0;
        I = 1;
    }

    // Calculate new Ease Factor
    EF = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

    // Clamp EF at a minimum of 1.3
    if (EF < 1.3) {
        EF = 1.3;
    }

    return {
        interval: I,
        repetitions: R,
        easeFactor: EF
    };
}