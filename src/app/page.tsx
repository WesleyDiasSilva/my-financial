import Link from "next/link";
import { Infinity, CheckCircle2, ArrowRight, Instagram, Linkedin } from "lucide-react";

const features = [
  {
    title: "Gestão Financeira Inteligente",
    description: "Controle seu fluxo de caixa automaticamente. Visualize receitas e despesas com gráficos dinâmicos e receba insights gerados por IA para economizar mais.",
    icon: "📊",
    bullets: [
      "Categorização automática de gastos",
      "Gráficos de barras e linhas interativos",
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOVTCET6-mW62CxT7AN__jzAHImPYyMUusdlJ-8p6YT_2jJR3-kj92FxUWYl5nKmMcpD8vpGN_fwCOF-oe2R6Ke9Hsf_vi3wjotlSb2_oUitC6pbIBWPvM-7_F7WwqyDIgpkIif2T7hRvzHzW2qsJiq9nvHryN8lSTadWiITPfXnokzoSTBX6dFRYJ9ltvIBT9vxIn3iT3P_QK7muAfzNqWbVIAVqr6FQEPxJjVpcqimIIaksO3w9ynJX1JX2LmNMRY3rdehuLEyix",
    imageAlt: "Dashboard financeiro moderno com gráficos coloridos",
    imagePosition: "right" as const,
    glow: true,
    comingSoon: false,
  },
  {
    title: "Organização Doméstica",
    description: "Simplifique o dia a dia da casa. Listas de compras compartilhadas em tempo real e divisão de tarefas domésticas para que ninguém fique sobrecarregado.",
    icon: "👥",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBca8e3y31lfsAQRN1cwzxXFSALXPm_CYNZb_5zfkNIu3NAA6DYuXVodzMVZ1Tzs9XJnxw9sTfGo7JsX4I6oqcGYKWtF9if785IKVLMelguUP0eh-xFEduNd1deQa4TLU1mlrWaQn2MlmHwCPEu9yZICQLkbC6OzA_xKAmukczUJqe33RgrGVQxD18sMXUl2VAVwbECo81B41H6Re8ti3KzzEkB0uDWWoC2juToEU5p8al3NeDyxtJyF8bGsKHE98cToAjKbcMUQinz",
    imageAlt: "Interface de lista de tarefas colaborativa",
    imagePosition: "left" as const,
    glow: false,
    comingSoon: true,
    syncInfo: { title: "Sincronização Total", subtitle: "Atualizações instantâneas para a família" },
  },
  {
    title: "Saúde e Bem-estar",
    description: "Centralize seu histórico médico. Anexe exames, receba alertas de medicação e tenha suas prescrições sempre à mão, protegidas por criptografia de ponta a ponta.",
    icon: "🏥",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4NiISmKpKTjj98mvvwnfU_u0Xc8CLezt04zp3Z0sip7sXNZ4aL0PcfMK8VrZbB2KAqYMPPuTICYoD99mNbYtUQqt-9bqrB0wC4E4oM7bsbuqb1G3pktCHobfqY5wqUGqRunndwwkcQ9_8wCoKuZ0acxVtnItI4uZd8OUNhPIaSk6mQpeu-I5H579-RoGpgMBRxPo6vLGFUYvfoPFZIQ6ymwqRW9sYlT_j9cWzhocANMSto_PRD-IwvH6gnZ2Q7owEXqePoP7Orqqw",
    imageAlt: "Interface de histórico médico com documentos anexados",
    imagePosition: "right" as const,
    glow: true,
    comingSoon: true,
    miniCards: [
      { icon: "📎", label: "Arquivos Seguros" },
      { icon: "🔔", label: "Lembretes Úteis" },
    ],
  },
  {
    title: "Calendário da Família",
    description: "Nunca mais esqueça um aniversário ou evento importante. Rastreador de presentes integrado e planejamento compartilhado para feriados e reuniões.",
    icon: "📅",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvNQgk_lUZNEQQbc_FuKxM3HktAv69xv2aWxlvgrF4AUZG98ZgZ_fJVzK9WhFPJaakugCXkCrJR1NDSzEPpUKtrVJQmj0fpDxsBn5MkSaMtkWEWbgRmLE_miKCDvnlbzDHqDi5zG6zpug40HqXMPPlki4s_R36avuBCPxZpF5RdUMfa-VAizrThIo2lIdl_ucu8xtv2nSuVNHu1RXJ724ZQr4VKACMZ6prozWN72x6ArElw91UYRGjZZy5X_Gxetji3IwGf9KbobX6",
    imageAlt: "Calendário familiar com eventos marcados",
    imagePosition: "left" as const,
    glow: false,
    comingSoon: true,
    tags: ["Aniversários", "Eventos Escolares", "Gifting Tracker"],
  },
];

export default function LandingPage() {
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
            <a className="text-cyan-400 text-sm font-semibold" href="#">Recursos</a>
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
            Plataforma All-in-One
          </span>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Conheça os <span className="text-cyan-400">Recursos</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl">
            Tudo o que você precisa para gerenciar sua vida financeira, pessoal e familiar em um só lugar, potencializado por inteligência artificial.
          </p>
        </div>

        {/* Features */}
        <section className="space-y-32">
          {features.map((feature, index) => (
            <div key={index} className="grid md:grid-cols-2 gap-12 items-center">
              {/* Text Side */}
              <div className={feature.imagePosition === "right" ? "order-2 md:order-1" : "order-2"}>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-3xl mb-6">
                  {feature.icon}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{feature.title}</h2>
                <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{feature.description}</p>

                {feature.bullets && (
                  <ul className="space-y-3 mb-8">
                    {feature.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-300">
                        <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}

                {feature.syncInfo && (
                  <div className="flex gap-4 items-center">
                    <div className="flex -space-x-3 overflow-hidden">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-[#101f22] bg-zinc-700" />
                      ))}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{feature.syncInfo.title}</span>
                      <span className="text-xs text-zinc-400">{feature.syncInfo.subtitle}</span>
                    </div>
                  </div>
                )}

                {feature.miniCards && (
                  <div className="grid grid-cols-2 gap-4">
                    {feature.miniCards.map((card, i) => (
                      <div key={i} className="p-4 rounded-xl border border-[#234248] bg-[#1a2e32]/50">
                        <span className="text-xl mb-2 block">{card.icon}</span>
                        <p className="text-sm font-bold">{card.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {feature.tags && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {feature.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-[#234248] text-xs font-semibold">{tag}</span>
                    ))}
                  </div>
                )}


              </div>

              {/* Image Side */}
              <div className={`${feature.imagePosition === "right" ? "order-1 md:order-2" : "order-1"} rounded-2xl p-4 ${feature.glow ? "shadow-[0_0_20px_rgba(19,200,236,0.2)]" : ""}`} style={{ background: "rgba(35, 66, 72, 0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(19, 200, 236, 0.1)" }}>
                <div className="rounded-xl overflow-hidden aspect-video bg-zinc-800 relative group">
                  {feature.comingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#101f22]/60 backdrop-blur-sm z-10">
                      <span className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-lg font-bold border border-cyan-500/30 uppercase tracking-widest text-sm">
                        Em Breve
                      </span>
                    </div>
                  )}
                  {feature.glow && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent pointer-events-none" />
                  )}
                  <img
                    className={`w-full h-full object-cover ${feature.comingSoon ? "opacity-50" : ""}`}
                    alt={feature.imageAlt}
                    src={feature.image}
                  />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* CTA Section */}
        <section className="mt-32 p-8 md:p-16 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-[#1a2e32] to-[#101f22] border border-cyan-500/30 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[120px] rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 blur-[120px] rounded-full -ml-32 -mb-32" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Pronto para transformar sua rotina?</h2>
            <p className="text-zinc-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já simplificaram suas vidas com o MyLife. Experimente gratuitamente por 14 dias.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register" className="w-full sm:w-auto bg-cyan-400 text-[#101f22] text-lg font-black px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(19,200,236,0.2)] shadow-lg shadow-cyan-500/20 text-center">
                COMEÇAR GRATUITAMENTE
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto bg-transparent border-2 border-zinc-600 hover:border-cyan-400 text-white text-lg font-black px-8 py-4 rounded-xl transition-colors text-center">
                VER PLANOS
              </Link>
            </div>
            <p className="mt-6 text-sm text-zinc-500 font-medium">Não requer cartão de crédito • Cancele a qualquer momento</p>
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
              <li><a className="hover:text-cyan-400 transition-colors" href="#">Recursos</a></li>
              <li><Link className="hover:text-cyan-400 transition-colors" href="/pricing">Planos</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link className="hover:text-cyan-400 transition-colors" href="/about">Sobre Nós</Link></li>
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
