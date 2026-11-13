// Header com fundo ao rolar
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Menu mobile
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');
menuToggle.addEventListener('click', () => {
  nav.classList.toggle('open');
  menuToggle.classList.toggle('open');
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle.classList.remove('open');
}));

// Link ativo conforme a seção
const links = document.querySelectorAll('.nav__link[href^="#"]');
const sections = [...links].map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => spy.observe(s));

// Animação de entrada
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// Contadores
const countObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const end = +el.dataset.count;
    const pre = el.dataset.prefix || '';
    const suf = el.dataset.suffix || '';
    const start = performance.now();
    const dur = 1400;
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = pre + Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countObs.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el));

// FAQ (acordeão)
document.querySelectorAll('.faq__item').forEach(item => {
  const q = item.querySelector('.faq__q');
  const a = item.querySelector('.faq__a');
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq__item.open').forEach(o => {
      o.classList.remove('open');
      o.querySelector('.faq__a').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

// "Quero esse plano": abre a janela com pagar online ou WhatsApp
const payModal = document.getElementById('payModal');
const payOnline = document.getElementById('payOnline');
const payErro = document.getElementById('payErro');
let planoAtual = null;

function fecharPagamento() {
  payModal.hidden = true;
  document.body.style.overflow = '';
}

document.querySelectorAll('.plan__btn[data-plano]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    planoAtual = btn.dataset.plano;
    document.getElementById('payNome').textContent = btn.dataset.nome;
    document.getElementById('payValor').textContent = btn.dataset.valor;
    document.getElementById('payDetalhe').textContent = btn.dataset.detalhe || '';
    document.getElementById('payWhats').href = btn.href; // mesma mensagem de antes
    payErro.hidden = true;
    payOnline.disabled = false;
    payOnline.textContent = 'Pagar online (Pix ou cartão)';
    payModal.hidden = false;
    document.body.style.overflow = 'hidden';
  });
});

document.getElementById('payClose').addEventListener('click', fecharPagamento);
payModal.addEventListener('click', e => { if (e.target === payModal) fecharPagamento(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !payModal.hidden) fecharPagamento(); });

payOnline.addEventListener('click', async () => {
  payOnline.disabled = true;
  payOnline.textContent = 'Abrindo pagamento…';
  payErro.hidden = true;
  try {
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plano: planoAtual }),
    });
    const d = await r.json();
    if (!r.ok || !d.url) throw new Error(d.erro || 'Erro ao criar pagamento');
    location.href = d.url;
  } catch (err) {
    payErro.textContent = 'Não foi possível abrir o pagamento agora. Tente de novo ou fale comigo no WhatsApp.';
    payErro.hidden = false;
    payOnline.disabled = false;
    payOnline.textContent = 'Pagar online (Pix ou cartão)';
  }
});

// Ano no rodapé
document.getElementById('year').textContent = new Date().getFullYear();
