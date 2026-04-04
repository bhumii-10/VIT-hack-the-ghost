import React, { useState, useEffect, Children } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Card = ({ children, className = "" }) => {
    return (
        <div className={`h-full w-full ${className}`}>
            {children}
        </div>
    );
};

const CardSwap = ({ children, delay = 4000 }) => {
    const [cards, setCards] = useState(Children.toArray(children));

    useEffect(() => {
        setCards(Children.toArray(children));
    }, [children]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCards((prev) => {
                const newCards = [...prev];
                const first = newCards.shift();
                newCards.push(first);
                return newCards;
            });
        }, delay);

        return () => clearInterval(interval);
    }, [delay]);

    const swapCards = () => {
        setCards((prev) => {
            const newItems = [...prev];
            const first = newItems.shift();
            newItems.push(first);
            return newItems;
        });
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center perspective-1000">
            <div className="relative w-[400px] h-[500px]">
                <AnimatePresence mode="popLayout">
                    {cards.map((card, index) => {
                        // Check if card is a React element and has a key, otherwise fallback to index
                        const key = React.isValidElement(card) ? card.key || index : index;
                        const isFront = index === 0;

                        return (
                            <motion.div
                                key={key}
                                layoutId={`card-${key}`}
                                onClick={swapCards}
                                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                                animate={{
                                    scale: isFront ? 1 : 0.95 - index * 0.05,
                                    y: isFront ? 0 : -15 * index,
                                    zIndex: cards.length - index,
                                    opacity: isFront ? 1 : 0.6 - index * 0.1,
                                    rotateX: isFront ? 0 : 5,
                                }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className={`absolute inset-0 rounded-3xl p-10 flex flex-col justify-between border backdrop-blur-xl shadow-2xl cursor-pointer
                    ${isFront
                                        ? 'bg-[#15151e]/90 border-crisis-red/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]'
                                        : 'bg-[#0f0f15]/80 border-white/5 grayscale opacity-50'}`}
                            >
                                {card}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Click Hint */}
            <div className="absolute bottom-[-40px] right-0 text-xs font-mono text-gray-500 font-bold tracking-widest uppercase">
                [ Click to Swap ]
            </div>
        </div>
    );
};

export default CardSwap;
