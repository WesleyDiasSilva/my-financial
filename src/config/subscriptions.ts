export type SubscriptionPlan = {
    id: string;
    name: string;
    description: string;
    stripePriceId: string;
    stripePriceIdYearly?: string;
    priceMonthly: string;
    priceYearly: string;
    suffix?: string;
    isPopular?: boolean;
    buttonLabel?: string;
    buttonStyle?: string;
    features: { text: string; included: boolean }[];
};

export const storeSubscriptionPlans: SubscriptionPlan[] = [
    {
        id: "essential",
        name: "Essential",
        description: "O básico essencial para começar.",
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ESSENTIAL_PRICE_ID || "mock_price_essential",
        stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_ESSENTIAL_PRICE_ID_YEARLY || "mock_price_essential_yearly",
        priceMonthly: "Gratuito",
        priceYearly: "Gratuito",
        isPopular: false,
        buttonLabel: "Assinar",
        buttonStyle: "bg-cyan-500/20 text-white hover:bg-cyan-500/30",
        features: [
            { text: "Recursos básicos de gestão", included: true },
            { text: "Acesso individual", included: true },
            { text: "Relatórios simples", included: true },
            { text: "Suporte premium", included: false },
        ],
    },
    {
        id: "pro",
        name: "Pro",
        description: "Ferramentas avançadas para o seu dia.",
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MENSAL_ID || "mock_price_pro",
        stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_ANUAL_ID || "mock_price_pro_yearly",
        priceMonthly: "R$ 39,99",
        priceYearly: "R$ 31,99",
        suffix: "/mês",
        isPopular: true,
        buttonLabel: "Assinar",
        buttonStyle: "bg-cyan-500 text-[#101e22] hover:opacity-90 shadow-[0_0_20px_rgba(13,185,242,0.4)]",
        features: [
            { text: "Gestão financeira avançada", included: true },
            { text: "Importação de arquivos OFX", included: true },
            { text: "Projeções mensais detalhadas", included: true },
            { text: "Suporte padrão 24/7", included: true },
        ],
    },
    {
        id: "prime",
        name: "Prime",
        description: "Conecte sua família em um só lugar.",
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRIME_MENSAL_ID || "mock_price_prime",
        stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRIME_ANUAL_ID || "mock_price_prime_yearly",
        priceMonthly: "R$ 69,99",
        priceYearly: "R$ 55,99",
        suffix: "/mês",
        isPopular: false,
        buttonLabel: "Assinar",
        buttonStyle: "bg-cyan-500/20 text-white hover:bg-cyan-500/30",
        features: [
            { text: "Módulos compartilhados", included: true },
            { text: "Até 4 membros inclusos", included: true },
            { text: "Listas de compras inteligentes", included: true },
            { text: "Gestão de tarefas em equipe", included: true },
        ],
    },
    {
        id: "ultimate",
        name: "Ultimate",
        description: "O máximo de MyLife para você.",
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ULTIMATE_MENSAL_ID || "mock_price_ultimate",
        stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_ULTIMATE_ANUAL_ID || "mock_price_ultimate_yearly",
        priceMonthly: "R$ 89,99",
        priceYearly: "R$ 71,99",
        suffix: "/mês",
        isPopular: false,
        buttonLabel: "Assinar",
        buttonStyle: "bg-cyan-500/20 text-white hover:bg-cyan-500/30",
        features: [
            { text: "Todos os módulos futuros", included: true },
            { text: "Suporte VIP Prioritário", included: true },
            { text: "Analytics profundo & IA", included: true },
            { text: "Consultoria trimestral", included: true },
        ],
    },
];
