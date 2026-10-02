import Link from "next/link";

export default function Termos() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold mb-6">Termos de uso e privacidade</h1>

      <div className="space-y-8 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <section>
          <h2 className="text-lg font-bold mb-2 text-neutral-900 dark:text-neutral-100">
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

        <section>
          <h2 className="text-lg font-bold mb-2 text-neutral-900 dark:text-neutral-100">
            2. Âmbito geográfico
          </h2>
          <p>
            O serviço está limitado à <b>Cidade da Matola, Moçambique</b>.
            Pedidos com origem ou destino fora dos limites da cidade são
            bloqueados pela aplicação.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 text-neutral-900 dark:text-neutral-100">
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

        <section>
          <h2 className="text-lg font-bold mb-2 text-neutral-900 dark:text-neutral-100">
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

        <section>
          <h2 className="text-lg font-bold mb-2 text-neutral-900 dark:text-neutral-100">
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

        <section>
          <h2 className="text-lg font-bold mb-2 text-neutral-900 dark:text-neutral-100">
            6. Pagamento
          </h2>
          <p>
            No MVP, o condutor apenas <b>indica</b> o método de pagamento
            (Dinheiro, M-Pesa ou e-Mola) e a empresa confirma o recebimento.
            Nenhuma transação financeira é processada pela aplicação.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 text-neutral-900 dark:text-neutral-100">
            7. Contacto
          </h2>
          <p>
            Dúvidas sobre este protótipo: <b>admin@reboqueja.co.mz</b> ·
            Cidade da Matola, Moçambique.
          </p>
        </section>
      </div>

      <div className="mt-10">
        <Link href="/" className="text-primary-600 font-semibold underline">
          ← Voltar ao início
        </Link>
      </div>
    </div>
  );
}
