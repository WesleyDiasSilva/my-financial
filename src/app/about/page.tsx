import Link from "next/link";
import { Infinity, Shield, Zap, Heart, Users, Target, Instagram, Linkedin } from "lucide-react";

const values = [
    {
        icon: <Shield className="h-6 w-6" />,
        title: "Segurança Absoluta",
        description: "Seus dados são protegidos com criptografia de ponta a ponta. Utilizamos os mesmos protocolos de segurança de instituições financeiras."
    },
    {
        icon: <Zap className="h-6 w-6" />,
        title: "Simplicidade",
        description: "Interface intuitiva pensada para que qualquer pessoa consiga organizar sua vida em poucos minutos."
    },
    {
        icon: <Heart className="h-6 w-6" />,
        title: "Qualidade de Vida",
        description: "Mais do que finanças — MyLife é sobre ter clareza, controle e tranquilidade no dia a dia."
    },
    {
        icon: <Users className="h-6 w-6" />,
        title: "Feito para Famílias",
        description: "Do individual ao coletivo. Módulos compartilhados para que toda a família esteja sincronizada."
    },
    {
        icon: <Target className="h-6 w-6" />,
        title: "Foco em Resultados",
        description: "Metas, projeções e relatórios que realmente ajudam você a alcançar seus objetivos financeiros e pessoais."
    },
];

export default function AboutPage() {
    return (
        <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#101f22] text-white antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-[#234248] px-6 md:px-20 py-4" style={{ background: "rgba(35, 66, 72, 0.4)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(19, 200, 236, 0.1)" }}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-cyan-400">
                            <Infinity className="h-9 w-9" />
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight">MyLife</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-10">
                        <Link className="text-sm font-semibold hover:text-cyan-400 transition-colors" href="/">Recursos</Link>
                        <Link className="text-sm font-semibold hover:text-cyan-400 transition-colors" href="/pricing">Planos</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden sm:flex text-sm font-bold px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
                            Entrar
                        </Link>
                        <Link href="/register" className="bg-cyan-400 text-[#101f22] text-sm font-bold px-5 py-2.5 rounded-lg hover:brightness-110 shadow-[0_0_20px_rgba(19,200,236,0.2)] transition-all">
                            Começar Gratuitamente
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 md:py-24">
                {/* Hero */}
                <div className="text-center mb-24 max-w-3xl mx-auto">
                    <span className="inline-block py-1 px-3 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-4">
                        Sobre Nós
                    </span>
                    <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                        Conheça o <span className="text-cyan-400">MyLife</span>
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl leading-relaxed">
                        Nascemos da necessidade de simplificar. Em um mundo cada vez mais complexo,
                        acreditamos que gerenciar sua vida deve ser simples, intuitivo e até prazeroso.
                    </p>
                </div>

                {/* Mission */}
                <section className="grid md:grid-cols-2 gap-16 items-center mb-32">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Nossa Missão</h2>
                        <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                            O MyLife nasceu de uma ideia simples: <strong className="text-white">reunir tudo o que importa em um só lugar</strong>.
                            Finanças, saúde, tarefas, família — tudo conectado e acessível.
                        </p>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Queremos que você gaste menos tempo gerenciando planilhas e mais tempo vivendo.
                            Cada funcionalidade é pensada para eliminar a complexidade e entregar clareza.
                        </p>
                    </div>
                    <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: "rgba(35, 66, 72, 0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(19, 200, 236, 0.1)" }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[80px] rounded-full -mr-16 -mt-16" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                                    <Infinity className="h-8 w-8 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black">MyLife</h3>
                                    <p className="text-zinc-400 text-sm">Gestão Inteligente de Vida</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-[#234248] bg-[#1a2e32]/50 text-center">
                                    <p className="text-3xl font-black text-cyan-400">∞</p>
                                    <p className="text-xs text-zinc-400 mt-1">Possibilidades</p>
                                </div>
                                <div className="p-4 rounded-xl border border-[#234248] bg-[#1a2e32]/50 text-center">
                                    <p className="text-3xl font-black text-cyan-400">24/7</p>
                                    <p className="text-xs text-zinc-400 mt-1">Disponibilidade</p>
                                </div>
                                <div className="p-4 rounded-xl border border-[#234248] bg-[#1a2e32]/50 text-center">
                                    <p className="text-3xl font-black text-cyan-400">100%</p>
                                    <p className="text-xs text-zinc-400 mt-1">Seguro</p>
                                </div>
                                <div className="p-4 rounded-xl border border-[#234248] bg-[#1a2e32]/50 text-center">
                                    <p className="text-3xl font-black text-cyan-400">IA</p>
                                    <p className="text-xs text-zinc-400 mt-1">Integrada</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="mb-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black mb-4">Nossos Valores</h2>
                        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                            Os princípios que guiam cada decisão, cada feature e cada pixel do MyLife.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {values.map((value, index) => (
                            <div
                                key={index}
                                className="p-8 rounded-2xl hover:translate-y-[-4px] transition-transform duration-300"
                                style={{ background: "rgba(35, 66, 72, 0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(19, 200, 236, 0.1)" }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
                                    {value.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="p-8 md:p-16 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-[#1a2e32] to-[#101f22] border border-cyan-500/30 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[120px] rounded-full -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 blur-[120px] rounded-full -ml-32 -mb-32" />
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Faça parte dessa jornada</h2>
                        <p className="text-zinc-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                            Estamos construindo o futuro da gestão pessoal. Comece agora e transforme a maneira como você organiza sua vida.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link href="/register" className="w-full sm:w-auto bg-cyan-400 text-[#101f22] text-lg font-black px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(19,200,236,0.2)] text-center">
                                CRIAR MINHA CONTA
                            </Link>
                            <Link href="/pricing" className="w-full sm:w-auto bg-transparent border-2 border-zinc-600 hover:border-cyan-400 text-white text-lg font-black px-8 py-4 rounded-xl transition-colors text-center">
                                VER PLANOS
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#234248] bg-[#101f22] px-6 md:px-20 py-12">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <Infinity className="h-6 w-6 text-cyan-400" />
                            <h2 className="text-xl font-extrabold tracking-tight">MyLife</h2>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            A plataforma definitiva para quem busca organização, clareza financeira e saúde em um só lugar.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Produto</h4>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li><Link className="hover:text-cyan-400 transition-colors" href="/">Recursos</Link></li>
                            <li><Link className="hover:text-cyan-400 transition-colors" href="/pricing">Planos</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Empresa</h4>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li><a className="hover:text-cyan-400 transition-colors" href="#">Sobre Nós</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Social</h4>
                        <div className="flex gap-4">
                            <a className="w-8 h-8 rounded-lg bg-[#234248] flex items-center justify-center hover:bg-cyan-500/20 hover:text-cyan-400 transition-all" href="https://www.google.com" target="_blank" rel="noopener noreferrer">
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a className="w-8 h-8 rounded-lg bg-[#234248] flex items-center justify-center hover:bg-cyan-500/20 hover:text-cyan-400 transition-all" href="https://www.google.com" target="_blank" rel="noopener noreferrer">
                                <Linkedin className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto border-t border-[#234248] mt-12 pt-8 text-center text-xs text-zinc-500">
                    © 2025 MyLife Platform. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
}
