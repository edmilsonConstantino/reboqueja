import Link from "next/link";

export default function Termos() {
  return (
    <div className="bg-[#FAF7F2] dark:bg-[#0C0603] transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9A4D0D] dark:text-[#F59E0B] mb-2">
            Informação legal
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1A100A] dark:text-white">
            Termos de uso e privacidade
          </h1>
          <p className="text-sm text-[#6B5747] dark:text-[#B9A490] mt-2">
            Regras de funcionamento, cobertura na Cidade da Matola e tratamento de dados.
          </p>
        </header>

        <div className="rounded-3xl border border-[#E5D6C3] dark:border-[#492C19]/80 bg-white dark:bg-[#1A0F08] p-6 sm:p-8 shadow-sm dark:shadow-none space-y-6 text-sm leading-relaxed text-[#4A3728] dark:text-[#D1C0AE]">
          <section className="pb-5 border-b border-slate-200/80 dark:border-white/10">
            <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
              1. Protótipo académico
            </h2>
            <p>
              O ReboqueJá é um <b>protótipo académico</b> desenvolvido como
              trabalho de fim de curso. Não é um serviço comercial: não existe
              pagamento real, não há contrato de prestação de serviços e os dados
              de empresas e utilizadores são fictícios (dados de exemplo). O
              sistema serve para avaliar a usabilidade e a utilidade da ideia com
              utilizadores reais.
            </p>
          </section>

          <section className="pb-5 border-b border-slate-200/80 dark:border-white/10">
            <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
              2. Âmbito geográfico
            </h2>
            <p>
              O serviço está limitado à <b>Cidade da Matola, Moçambique</b>.
              Pedidos com origem ou destino fora dos limites da cidade são
              bloqueados pela aplicação.
            </p>
          </section>

          <section className="pb-5 border-b border-slate-200/80 dark:border-white/10">
            <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
              3. Preços
            </h2>
            <p>
              Os preços são apresentados sempre em <b>faixas</b> (ex.: 500 – 1 000
              MT) definidas por cada empresa por tipo de veículo e intervalo de
              distância. O valor final é acordado diretamente entre o condutor e a
              empresa, no momento do serviço, dentro da faixa apresentada. A
              aplicação não processa pagamentos.
            </p>
          </section>

          <section className="pb-5 border-b border-slate-200/80 dark:border-white/10">
            <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
              4. Consentimento e publicação de dados das empresas
            </h2>
            <p>
              O nome, o contacto e as faixas de preço de uma empresa só ficam
              visíveis publicamente depois de: (a) a empresa aceitar
              expressamente os termos de publicação (a data do consentimento fica
              registada); e (b) o administrador aprovar o registo. As empresas
              pendentes ou rejeitadas não aparecem na lista pública nem nas
              sugestões de pedido.
            </p>
          </section>

          <section className="pb-5 border-b border-slate-200/80 dark:border-white/10">
            <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
              5. Dados pessoais
            </h2>
            <p>
              Recolhemos o mínimo necessário: nome, telefone, e-mail (empresas) e
              a localização indicada nos pedidos. A localização é usada apenas
              para encontrar e acompanhar o reboque. No protótipo, os dados podem
              ser apagados a qualquer momento (a base de dados é reiniciada com o
              comando de seed). Não partilhamos dados com terceiros.
            </p>
          </section>

          <section className="pb-5 border-b border-slate-200/80 dark:border-white/10">
            <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
              6. Pagamento
            </h2>
            <p>
              No MVP, o condutor apenas <b>indica</b> o método de pagamento
              (Dinheiro, M-Pesa ou e-Mola) e a empresa confirma o recebimento.
              Nenhuma transação financeira é processada pela aplicação.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
              7. Contacto
            </h2>
            <p>
              Dúvidas sobre este protótipo: <b>admin@reboqueja.co.mz</b> ·
              Cidade da Matola, Moçambique.
            </p>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-amber-700 dark:text-primary-400 font-semibold hover:underline">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
