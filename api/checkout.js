// =====================================================================
//  Função de pagamento (Vercel) — cria uma cobrança no Mercado Pago
//  (Checkout Pro) e devolve o link para a pessoa pagar.
//
//  Precisa da variável de ambiente MP_ACCESS_TOKEN, configurada no
//  painel da Vercel (Settings → Environment Variables).
//  A chave NUNCA fica no código do site.
//
//  O valor fica aqui no servidor, e não na página, para ninguém
//  conseguir alterar o preço pelo navegador.
// =====================================================================

const PRODUTO = {
  id: 'teste-01',
  titulo: 'Pagamento de teste - Nexus Technology',
  valor: 10.0, // R$
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Use POST' });
    return;
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    res.status(500).json({ erro: 'MP_ACCESS_TOKEN não configurado na Vercel' });
    return;
  }

  const site = `https://${req.headers.host}`;
  const voltar = `${site}/pagamento-teste.html`;

  const preferencia = {
    items: [{
      id: PRODUTO.id,
      title: PRODUTO.titulo,
      quantity: 1,
      unit_price: PRODUTO.valor,
      currency_id: 'BRL',
    }],
    // para onde o Mercado Pago devolve a pessoa depois do pagamento
    back_urls: { success: voltar, failure: voltar, pending: voltar },
    auto_return: 'approved',
    payment_methods: {
      excluded_payment_types: [{ id: 'ticket' }], // sem boleto
      installments: 1,
    },
    statement_descriptor: 'NEXUS TECH',
    external_reference: `teste-${Date.now()}`,
  };

  try {
    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferencia),
    });
    const dados = await r.json();

    if (!r.ok) {
      res.status(502).json({ erro: 'O Mercado Pago recusou a cobrança', detalhe: dados.message });
      return;
    }

    // credenciais de teste (TEST-...) usam o checkout de testes
    const url = token.startsWith('TEST-')
      ? (dados.sandbox_init_point || dados.init_point)
      : dados.init_point;

    res.status(200).json({ url, valor: PRODUTO.valor });
  } catch (e) {
    res.status(500).json({ erro: 'Falha ao falar com o Mercado Pago' });
  }
};
