// =====================================================================
//  Função de pagamento (Vercel) — cria uma cobrança no Mercado Pago
//  (Checkout Pro) e devolve o link para a pessoa pagar.
//
//  Precisa da variável de ambiente MP_ACCESS_TOKEN com a credencial de
//  PRODUÇÃO do Mercado Pago (começa com APP_USR-), configurada no
//  painel da Vercel (Settings → Environment Variables).
//  A chave NUNCA fica no código do site.
//
//  Os valores ficam aqui no servidor, e não na página, para ninguém
//  conseguir alterar o preço pelo navegador.
//
//  EDITAR PREÇOS: mude o "valor" de cada plano abaixo (e também o
//  texto no index.html, para o site mostrar o mesmo valor).
// =====================================================================

const PLANOS = {
  // Plano mensal: cobra a 1ª mensalidade (criação é grátis)
  mensal: {
    titulo: 'Site Mensal (Landing Page) - 1ª mensalidade',
    valor: 99.99,
    parcelas: 1,
  },
  landing: {
    titulo: 'Landing Page - criação do site',
    valor: 497.0,
    parcelas: 12,
  },
  institucional: {
    titulo: 'Site Institucional - criação do site',
    valor: 1497.0,
    parcelas: 12,
  },
  loja: {
    titulo: 'Loja Virtual - criação do site',
    valor: 2197.0,
    parcelas: 12,
  },
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

  let corpo = req.body || {};
  if (typeof corpo === 'string') {
    try { corpo = JSON.parse(corpo); } catch (e) { corpo = {}; }
  }
  const id = corpo.plano;
  const plano = Object.prototype.hasOwnProperty.call(PLANOS, id) ? PLANOS[id] : null;
  if (!plano) {
    res.status(400).json({ erro: 'Plano inválido' });
    return;
  }

  const site = `https://${req.headers.host}`;
  const voltar = `${site}/pagamento.html?plano=${id}`;

  const preferencia = {
    items: [{
      id,
      title: plano.titulo,
      quantity: 1,
      unit_price: plano.valor,
      currency_id: 'BRL',
    }],
    // para onde o Mercado Pago devolve a pessoa depois do pagamento
    back_urls: { success: voltar, failure: voltar, pending: voltar },
    auto_return: 'approved',
    payment_methods: {
      excluded_payment_types: [{ id: 'ticket' }], // sem boleto (só Pix e cartão)
      installments: plano.parcelas,
    },
    statement_descriptor: 'NEXUS TECH',
    external_reference: `${id}-${Date.now()}`,
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

    res.status(200).json({ url: dados.init_point, valor: plano.valor });
  } catch (e) {
    res.status(500).json({ erro: 'Falha ao falar com o Mercado Pago' });
  }
};
