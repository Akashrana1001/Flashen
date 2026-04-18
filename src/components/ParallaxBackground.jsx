import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ParallaxBackground = () => {
    const { scrollYProgress } = useScroll();

    const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 0.3, 0.1]);

    return (
        <motion.div
            style={{ y, opacity }}
            className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        >
            <div
                className="w-full h-full rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(82,39,255,0.15) 0%, rgba(0,0,0,0) 70%)',
                    filter: 'blur(80px)',
                }}
            />
        </motion.div>
    );
};

export default ParallaxBackground;
