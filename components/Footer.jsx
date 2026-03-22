import { motion } from 'framer-motion';

export default function Footer() {
    return (
        <motion.footer
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-[#10151aee] border-t border-[#23272f] text-slate-400 p-6 mt-12 text-center text-sm shadow-inner backdrop-blur"
        >
            <div className="container mx-auto space-y-2">
                <p className="text-slate-300 font-semibold tracking-wide">
                    &copy; {new Date().getFullYear()} TradiX.AI. All rights reserved.
                </p>
                <p>
                    Disclaimer: Stock data and predictions are for informational purposes only and not financial advice.
                </p>
            </div>
        </motion.footer>
    );
}