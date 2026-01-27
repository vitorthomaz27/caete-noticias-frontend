import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Newspaper, Store, Briefcase, Search, MapPin, 
  Phone, MessageCircle, Star, Camera, Send, Info, 
  ExternalLink, PlayCircle, Settings, Trash2 
} from 'lucide-react';

import { getToken } from "firebase/messaging";
import { messaging } from "./firebase-config"; // Configuração com seus dados do Firebase

// --- CONFIGURAÇÃO SUPABASE ---
const supabase = createClient(
  'https://qhyzzjgqujueleixbjlg.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeXp6amdxdWp1ZWxlaXhiamxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTc2NDQsImV4cCI6MjA4MzQ3MzY0NH0.vh-j9ujwpblHYvG8za3nzsMOnLHESbDaN_Aqpwp_Zuc'
);

// --- COMPONENTE DA TELA PÚBLICA ---
function PublicApp() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [noticias, setNoticias] = useState([]);
  const [guia, setGuia] = useState([]);
  const [vagas, setVagas] = useState([]);
  const [config, setConfig] = useState({ banner: {}, utilidades: [] });
  const [termoBusca, setTermoBusca] = useState('');
  const [noticiaAberta, setNoticiaAberta] = useState(null);
  const [utilidadeAberta, setUtilidadeAberta] = useState(null);
  // No início do seu componente App
  const [mostrarBannerPush, setMostrarBannerPush] = useState(Notification.permission !== 'granted');
  const inscreverParaNotificacoes = async () => {
    try {
      // 1. Garante que o navegador suporta Service Worker
      if (!('serviceWorker' in navigator)) return;

      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") return;

      // 2. Busca o registro do Service Worker que já está ativo (visto no console)
      const registration = await navigator.serviceWorker.ready;

      // 3. Obtém o Token vinculado a esse registro específico
      const token = await getToken(messaging, { 
        vapidKey: "BGWsaZtpU0wAzDb9Mll-prGYdCzFCSbU_onPf_ND_veVS3p_bbpO2gTxOV4d3I8RtLF-jIUpnVCIBQZ8_ifviBA",
        serviceWorkerRegistration: registration 
      });

      if (token) {
        const { error } = await supabase
          .from('inscricoes_push')
          .upsert([{ token }], { onConflict: 'token' });

        if (!error) {
          console.log("Sucesso! Token salvo:", token);
          setMostrarBannerPush(false);
          alert("Notificações ativadas com sucesso!");
        }
      }
    } catch (err) {
      console.error("Erro detalhado na inscrição:", err);
      // Se o erro persistir, pode ser cache. Tente em Aba Anônima.
    }
  };
  useEffect(() => {
    // Tenta inscrever automaticamente após 5 segundos
    const timer = setTimeout(() => {
      if (Notification.permission !== 'denied') {
        inscreverParaNotificacoes();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Busca as listas normais
      const { data: n } = await supabase.from('noticias').select('*').order('created_at', { ascending: false });
      const { data: g } = await supabase.from('guia_comercial').select('*').order('plano', { ascending: false });
      const { data: v } = await supabase.from('vagas').select('*').order('created_at', { ascending: false });
      
      // 2. BUSCA O BANNER NA TABELA NOVA (banner_principal)
      const { data: b } = await supabase.from('banner_principal').select('*').eq('id', 1).single();
      
      // 3. Busca as utilidades na tabela home_config
      const { data: c } = await supabase.from('home_config').select('*').eq('id', 'utilidades').single();

      setNoticias(n || []);
      setGuia(g || []);
      setVagas(v || []);
      
      // Atualiza o estado config com os dados corretos de cada tabela
      setConfig({ 
        banner: b || { titulo: 'Anuncie Aqui', subtitulo: 'Sua marca em destaque' }, 
        utilidades: c?.lista_json || [] 
      });
    };
    
    fetchData();
  }, []);

  return (
    <div style={globalWrapper}>
      <div style={appContainer}>
        <header style={headerStyle}>
          <img src="/Logo.png" alt="Caeté Notícias" style={logoImgStyle} />
        </header>

        <main style={scrollableContent}>
          {/* ABA INÍCIO */}
          {activeTab === 'inicio' && (
            <div style={contentPadding}>
              {/* BANNER DE ANÚNCIO DINÂMICO */}
              <a 
                href={config.banner.link || "#"} 
                target="_blank" 
                rel="noreferrer" 
                style={{
                  ...superBannerAd, 
                  // Se houver imagem, usa ela com um degradê escuro. Se não, usa o fundo vermelho padrão.
                  backgroundImage: config.banner.imagem_url 
                    ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url(${config.banner.imagem_url})` 
                    : 'linear-gradient(45deg, #ff0000, #cc0000)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  textDecoration: 'none',
                  display: 'block',
                  cursor: config.banner.link ? 'pointer' : 'default'
                }}
              >
                <span style={adLabel}>Publicidade</span>
                <h3 style={{margin: 0, color: '#fff', fontSize: '18px', fontWeight: 'bold'}}>
                  {config.banner.titulo || "Anuncie Aqui"}
                </h3>
                <p style={{margin: '5px 0 0 0', fontSize: '13px', color: '#eee'}}>
                  {config.banner.subtitulo || "Sua marca em destaque no nosso app"}
                </p>
              </a>
              {mostrarBannerPush && (
                <div style={{
                  background: '#0a0a0a', 
                  padding: '15px', 
                  borderRadius: '10px', 
                  border: '1px solid #333',
                  margin: '15px 0'
                }}>
                  <h4 style={{ color: '#fff', margin: '0 0 5px 0', fontSize: '14px' }}>🔔 Alertas de Caeté</h4>
                  <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '10px' }}>
                    Receba notícias urgentes e ofertas do Guia Comercial.
                  </p>
                  <button 
                    onClick={inscreverParaNotificacoes}
                    style={{
                      background: '#000000',
                      color: '#fff',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '5px',
                      fontWeight: 'bold',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    ATIVAR NOTIFICAÇÕES
                  </button>
                </div>
              )}
              {/* SEÇÃO DE DESTAQUES (NOTÍCIAS) */}
              <h2 style={sectionTitle}><Star size={18} color="#ff0000"/> Destaques</h2>
              {noticias.filter(n => n.tipo === 'destaque').slice(0, 2).map(item => (
                <div key={item.id} style={heroNewsCard}>
                  <img src={item.imagem_url} style={heroImg} alt="" />
                  <div style={heroGradient}>
                    <h3 style={{margin: 0, fontSize: '16px', color: '#fff'}}>{item.titulo}</h3>
                  </div>
                </div>
              ))}

              {/* SEÇÃO DE UTILIDADES */}
              <h2 style={sectionTitle}>Utilidades</h2>
              <div style={quickLinksGrid}>
                {config.utilidades.map((u, i) => (
                  <button 
                    key={i} 
                    style={{...quickLinkItem, border: 'none', textAlign: 'left', cursor: 'pointer'}}
                    onClick={() => setUtilidadeAberta(u)} // Abre os detalhes da utilidade
                  >
                    <strong style={{display: 'block', fontSize: '14px', color: '#fff'}}>{u.nome}</strong>
                    <span style={{fontSize: '11px', color: '#ff0000'}}>{u.info}</span>
                  </button>
                ))}
              </div>
              {/* TELA DE DETALHES DA UTILIDADE (SOBREPOSIÇÃO) */}
              {utilidadeAberta && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                  background: '#000', zIndex: 2000, padding: '20px', overflowY: 'auto'
                }}>
                  <button 
                    onClick={() => setUtilidadeAberta(null)} 
                    style={{background: 'none', border: 'none', color: '#ff0000', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px'}}
                  >
                    ← Voltar para o Início
                  </button>

                  <h2 style={{fontSize: '22px', color: '#fff', marginBottom: '5px'}}>{utilidadeAberta.nome}</h2>
                  <p style={{color: '#666', marginBottom: '20px'}}>{utilidadeAberta.info}</p>

                  {/* SEÇÃO: HORÁRIOS DE ÔNIBUS (CARROSSEL DE IMAGENS) */}
                  {utilidadeAberta.tipo === 'imagens' && (
                    <div style={{display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollSnapType: 'x mandatory'}}>
                      {utilidadeAberta.dados?.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          style={{width: '100%', flexShrink: 0, borderRadius: '12px', scrollSnapAlign: 'start'}} 
                          alt={`Horário ${idx + 1}`} 
                        />
                      ))}
                    </div>
                  )}

                  {/* SEÇÃO: TELEFONES ÚTEIS (LISTA) */}
                  {utilidadeAberta.tipo === 'telefones' && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      {utilidadeAberta.dados?.map((contato, idx) => (
                        <div key={idx} style={{background: '#111', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <div>
                            <strong style={{display: 'block', color: '#fff'}}>{contato.nome}</strong>
                            <span style={{color: '#666', fontSize: '13px'}}>{contato.numero}</span>
                          </div>
                          <a href={`tel:${contato.numero}`} style={{background: '#333', padding: '8px', borderRadius: '50%', color: '#fff'}}>
                            <Phone size={18}/>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'noticias' && (
            <div style={contentPadding}>
              {/* Se NÃO houver notícia aberta, mostra a lista */}
              {!noticiaAberta ? (
                <>
                  <h2 style={sectionTitle}>Últimas Notícias</h2>
                  {noticias.map(item => (
                    <article 
                      key={item.id} 
                      style={{...newsRow, cursor: 'pointer'}} 
                      onClick={() => setNoticiaAberta(item)} // Abre a notícia ao clicar
                    >
                      <img src={item.imagem_url} style={newsThumb} alt="" />
                      <div style={newsContent}>
                        <span style={newsCategory}>CAETÉ</span>
                        <h3 style={newsTitleCompact}>{item.titulo}</h3>
                        <span style={newsDate}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </article>
                  ))}
                </>
              ) : (
                /* Se HOUVER notícia aberta, mostra o detalhe */
                <div style={{animation: 'fadeIn 0.3s'}}>
                  <button 
                    onClick={() => setNoticiaAberta(null)} 
                    style={{background: 'none', border: 'none', color: '#ff0000', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px'}}
                  >
                    ← Voltar para a notícias
                  </button>
                  <img src={noticiaAberta.imagem_url} style={{width: '100%', borderRadius: '12px', marginBottom: '15px'}} alt="" />
                  <h1 style={{fontSize: '22px', marginBottom: '10px'}}>{noticiaAberta.titulo}</h1>
                  <span style={newsDate}>{new Date(noticiaAberta.created_at).toLocaleDateString('pt-BR')}</span>
                  <div style={{marginTop: '20px', lineHeight: '1.6', color: '#ccc', fontSize: '16px', whiteSpace: 'pre-wrap'}}>
                    {noticiaAberta.resumo}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'guia' && (
            <div style={contentPadding}>
              {/* BARRA DE BUSCA - ADICIONADA AQUI */}
              <div style={{ marginBottom: '20px' }}>
                <div style={searchBar}>
                  <Search size={18} color="#666" />
                  <input 
                    type="text" 
                    placeholder="Buscar empresas ou categorias..." 
                    style={searchInput} 
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                  />
                </div>
              </div>

              <h2 style={sectionTitle}>Guia Comercial</h2>

              {/* LÓGICA DE FILTRO APLICADA AO MAP */}
              {guia
                .filter(emp => 
                  emp.nome.toLowerCase().includes(termoBusca.toLowerCase()) || 
                  emp.categoria.toLowerCase().includes(termoBusca.toLowerCase())
                )
                .map(emp => (
                  <div key={emp.id} style={emp.plano === 'premium' ? premiumBusinessCard : standardBusinessRow}>
                    {emp.plano === 'premium' && <img src={emp.imagem_url} style={businessThumb} alt="" />}
                    <div style={{flex: 1}}>
                      <span style={businessCat}>{emp.categoria}</span>
                      <h3 style={emp.plano === 'premium' ? businessName : {margin: '5px 0 10px 0', fontSize: '16px', color: '#fff'}}>{emp.nome}</h3>
                      <div style={businessActions}>
                        <a href={`https://wa.me/${emp.whatsapp}`} style={actionBtnZap}><MessageCircle size={14}/> WhatsApp</a>
                        <a href={`tel:${emp.whatsapp}`} style={actionBtnCall}><Phone size={14}/> Ligar</a>
                      </div>
                    </div>
                  </div>
                ))
              }
              
              {/* AVISO SE NÃO ENCONTRAR NADA */}
              {guia.filter(emp => 
                emp.nome.toLowerCase().includes(termoBusca.toLowerCase()) || 
                emp.categoria.toLowerCase().includes(termoBusca.toLowerCase())
              ).length === 0 && (
                <p style={{textAlign: 'center', color: '#666', marginTop: '20px'}}>Nenhuma empresa encontrada.</p>
              )}
            </div>
          )}

          {activeTab === 'vagas' && (
            <div style={contentPadding}>
              <h2 style={sectionTitle}>Vagas de Emprego</h2>
              {vagas.map(vaga => (
                <div key={vaga.id} style={jobCard}>
                  <h3>{vaga.titulo}</h3>
                  <p style={{color: '#ff0000', fontWeight: 'bold'}}>{vaga.empresa}</p>
                  <p style={{fontSize: '13px'}}>{vaga.descricao}</p>
                  <a href={`https://wa.me/${vaga.whatsapp}`} style={jobBtn}>Candidatar-se</a>
                </div>
              ))}
            </div>
          )}
        </main>

        <nav style={bottomNav}>
          <NavButton icon={<Home size={20} />} label="Início" tab="inicio" active={activeTab} set={setActiveTab} />
          <NavButton icon={<Newspaper size={20} />} label="Notícias" tab="noticias" active={activeTab} set={setActiveTab} />
          <NavButton icon={<Store size={20} />} label="Guia" tab="guia" active={activeTab} set={setActiveTab} isSpecial />
          <NavButton icon={<Briefcase size={20} />} label="Vagas" tab="vagas" active={activeTab} set={setActiveTab} />
        </nav>
      </div>
    </div>
  );
}

const NavButton = ({ icon, label, tab, active, set, isSpecial }) => (
  <button onClick={() => set(tab)} style={{...navBtnStyle, color: active === tab ? '#ff0000' : (isSpecial ? '#FFD700' : '#666')}}>
    {icon} <span style={{fontSize: '10px'}}>{label}</span>
  </button>
);

// --- PAINEL ADMIN ---
function AdminPortal() {
  const [aba, setAba] = useState('noticia');
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({ titulo: '', resumo: '', tipo: 'feed', nome: '', categoria: 'Alimentação', whatsapp: '', plano: 'basic', empresa: '', descricao: '' });
  const [configHome, setConfigHome] = useState({ bannerTitulo: '', bannerSub: '', bannerLink: '', utilNome: '', utilInfo: '' });
  const [utilidadesAtuais, setUtilidadesAtuais] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const [bannerArquivo, setBannerArquivo] = useState(null);
  const [tipoUtil, setTipoUtil] = useState('imagens'); // 'imagens' ou 'telefones'
  const [arquivosUtil, setArquivosUtil] = useState([]); // Array para múltiplas fotos
  const [contatosUtil, setContatosUtil] = useState([{ nome: '', numero: '' }]); // Array de objetos
  const [guia, setGuia] = useState([]); // Isso cria a variável 'guia' como uma lista vazia
  const [bannerData, setBannerData] = useState(null);
  // Define a "caixa" para guardar os textos do banner
  const [bannerForm, setBannerForm] = useState({ titulo: '', subtitulo: '' });
  // Excluir Empresa do Guia
  const [noticias, setNoticias] = useState([]); // Faltava para o deleteNoticia funcionar

  const [pushForm, setPushForm] = useState({ titulo: '', mensagem: '', link: '' });
  const [totalInscritos, setTotalInscritos] = useState(0);

  // useEffect para contar quantos usuários você já capturou
  useEffect(() => {
    const contarTokens = async () => {
      const { count } = await supabase
        .from('inscricoes_push')
        .select('*', { count: 'exact', head: true });
      setTotalInscritos(count || 0);
    };
    contarTokens();
  }, [aba]);
  
  useEffect(() => {
    const loadBanner = async () => {
      const { data } = await supabase.from('banner_principal').select('*').eq('id', 1).single();
      if (data) setBannerData(data);
    };
    loadBanner();
  }, []);

  useEffect(() => {
    const carregarDados = async () => {
      // 1. Busca empresas do Guia
      const { data: empresas } = await supabase.from('guia_comercial').select('*').order('nome');
      if (empresas) setGuia(empresas);

      // 2. Busca configuração do Banner
      const { data: b } = await supabase.from('banner_principal').select('*').eq('id', 1).single();
      if (b) setConfigHome(prev => ({...prev, bannerTitulo: b.titulo, bannerSub: b.subtitulo}));

      // 3. Busca Notícias (você precisará criar o state [noticias, setNoticias])
      const { data: news } = await supabase.from('noticias').select('*').order('created_at', {ascending: false});
      if (news) setNoticias(news);
    };

    carregarDados();
  }, []);
  
  const deleteEmpresa = async (id) => {
    if (window.confirm("Tem certeza que deseja remover esta empresa?")) {
      const { error } = await supabase.from('guia_comercial').delete().eq('id', id);
      if (!error) {
        setGuia(guia.filter(e => e.id !== id));
        alert("Empresa removida!");
      }
    }
  };

  const addEmpresa = async () => {
    // Validação básica
    if (!form.nome || !form.whatsapp) {
      return alert("Por favor, preencha o nome e o WhatsApp da empresa.");
    }

    try {
      const { data, error } = await supabase
        .from('guia_comercial') // Certifique-se que o nome da tabela no Supabase é 'guia'
        .insert([
          { 
            nome: form.nome, 
            categoria: form.categoria, 
            whatsapp: form.whatsapp, 
            plano: form.plano 
          }
        ])
        .select();

      if (error) throw error;

      // Atualiza a lista na tela e limpa o formulário
      setGuia([...guia, data[0]]);
      setForm({ nome: '', categoria: 'Alimentação', whatsapp: '', plano: 'basic' });
      alert("Empresa cadastrada com sucesso!");
      
    } catch (err) {
      alert("Erro ao cadastrar: " + err.message);
    }
  };

  // Excluir Notícia
  const deleteNoticia = async (id) => {
    if (window.confirm("Deseja apagar esta notícia permanentemente?")) {
      const { error } = await supabase.from('noticias').delete().eq('id', id);
      if (!error) {
        setNoticias(noticias.filter(n => n.id !== id));
        alert("Notícia apagada!");
      }
    }
  };

  useEffect(() => {
    if (aba === 'config') {
      supabase.from('home_config').select('*').eq('id', 'utilidades').single()
        .then(({ data }) => setUtilidadesAtuais(data?.lista_json || []));
    }
  }, [aba]);

  const addUtilidadeComplexa = async () => {
  setEnviando(true);
  try {
    let dadosFinal = [];

    // Lógica para IMAGENS (Ônibus, etc)
    if (tipoUtil === 'imagens') {
      const uploads = Array.from(arquivosUtil).map(async (file) => {
        const nomeUnico = `util_${Date.now()}_${file.name}`;
        await supabase.storage.from('midia-caete').upload(nomeUnico, file);
        return supabase.storage.from('midia-caete').getPublicUrl(nomeUnico).data.publicUrl;
      });
      dadosFinal = await Promise.all(uploads);
    } 
    // Lógica para TELEFONES
    else {
      dadosFinal = contatosUtil.filter(c => c.nome && c.numero);
    }

    const novaUtilidade = {
        nome: configHome.utilNome,
        info: configHome.utilInfo,
        tipo: tipoUtil,
        dados: dadosFinal
      };

      const novaListaGeral = [...utilidadesAtuais, novaUtilidade];
      
      const { error } = await supabase
        .from('home_config')
        .update({ lista_json: novaListaGeral })
        .eq('id', 'utilidades');

      if (error) throw error;

      alert("Utilidade adicionada com sucesso!");
      setUtilidadesAtuais(novaListaGeral);
      // Limpar campos
      setArquivosUtil([]);
      setContatosUtil([{ nome: '', numero: '' }]);
      setConfigHome({ ...configHome, utilNome: '', utilInfo: '' });
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const updateBanner = async () => {
    setEnviando(true);
    try {
      let imagem_url = "";

      // 1. Lógica de Upload da Imagem (se houver um novo arquivo selecionado)
      if (bannerArquivo) {
        const nomeUnico = `banner_${Date.now()}_${bannerArquivo.name}`;
        const { error: uploadError } = await supabase.storage
          .from('midia-caete') // Certifique-se que o bucket se chama assim
          .upload(nomeUnico, bannerArquivo);

        if (uploadError) throw uploadError;

        // Pega o link público da imagem enviada
        imagem_url = supabase.storage.from('midia-caete').getPublicUrl(nomeUnico).data.publicUrl;
      }

      // 2. Objeto com os dados para salvar
      const payload = {
        titulo: configHome.bannerTitulo, // Usando configHome que está nos seus inputs
        subtitulo: configHome.bannerSub,
        link: configHome.bannerLink
      };

      // Só adiciona a imagem_url ao payload se uma nova foto foi enviada
      if (imagem_url) payload.imagem_url = imagem_url;

      // 3. Atualiza o banco de dados na linha ID 1
      const { error: dbError } = await supabase
        .from('banner_principal')
        .update(payload)
        .eq('id', 1);

      if (dbError) throw dbError;

      alert("Banner e Imagem atualizados com sucesso!");
      setBannerArquivo(null); // Limpa o seletor de arquivo

    } catch (err) {
      alert("Erro ao atualizar banner: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const enviarPush = async () => {
    if (!pushForm.titulo || !pushForm.mensagem) {
      return alert("Por favor, preencha o título e a mensagem!");
    }

    setEnviando(true);
    try {
      // 1. Vai buscar os tokens reais da sua tabela (como já vimos no console)
      const { data: inscritos } = await supabase.from('inscricoes_push').select('token');
      const listaTokens = inscritos.map(i => i.token);

      if (listaTokens.length === 0) {
        return alert("Nenhum telemóvel inscrito para receber notificações.");
      }

      // 2. CHAMA A PONTE REAL (Edge Function) que criou no editor
      const { data, error } = await supabase.functions.invoke('enviar-notificacao', {
        body: { 
          titulo: pushForm.titulo, 
          mensagem: pushForm.mensagem, 
          link: pushForm.link,
          tokens: listaTokens 
        }
      });

      if (error) throw error;

      alert("Notificações enviadas com sucesso para os telemóveis!");
      setPushForm({ titulo: '', mensagem: '', link: '' });

    } catch (err) {
      console.error("Erro no disparo:", err);
      alert("Erro ao disparar: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const addUtilidade = async () => {
    setEnviando(true);
    const novaLista = [...utilidadesAtuais, { nome: configHome.utilNome, info: configHome.utilInfo }];
    const { error } = await supabase.from('home_config').update({ lista_json: novaLista }).eq('id', 'utilidades');
    if (!error) {
      setUtilidadesAtuais(novaLista);
      setConfigHome({...configHome, utilNome: '', utilInfo: ''});
      alert("Utilidade Adicionada!");
    }
    setEnviando(false);
  };

  const deleteUtilidade = async (index) => {
    const novaLista = utilidadesAtuais.filter((_, i) => i !== index);
    const { error } = await supabase.from('home_config').update({ lista_json: novaLista }).eq('id', 'utilidades');
    if (!error) setUtilidadesAtuais(novaLista);
  };

  const handlePostGeral = async (e) => {
      if (e) e.preventDefault();
      if (enviando) return;

      setEnviando(true);
      try {
        let imagem_url = "";
        
        // Upload de imagem apenas se houver arquivo
        if (arquivo) {
          const nomeUnico = `${Date.now()}_${arquivo.name}`;
          await supabase.storage.from('midia-caete').upload(nomeUnico, arquivo);
          imagem_url = supabase.storage.from('midia-caete').getPublicUrl(nomeUnico).data.publicUrl;
        }

        // Define a tabela e o payload baseado na aba
        const tabela = aba === 'noticia' ? 'noticias' : 'vagas';
        const payload = aba === 'noticia' 
          ? { titulo: form.titulo, resumo: form.resumo, tipo: form.tipo, imagem_url }
          : { titulo: form.titulo, empresa: form.empresa, descricao: form.descricao, whatsapp: form.whatsapp };

        const { error } = await supabase.from(tabela).insert([payload]);
        
        if (error) throw error;

        alert("Publicado com sucesso!");
        setArquivo(null);
        setForm({ ...form, titulo: '', resumo: '', empresa: '', descricao: '' });
      } catch (err) { 
        alert("Erro: " + err.message); 
      } finally { 
        setEnviando(false); 
      }
    };

  return (
    <div style={globalWrapper}>
      <div style={appContainer}>
        <header style={headerStyle}><h2 style={{color: '#ff0000', margin: 0, fontSize: '18px'}}>ADMIN CAETÉ</h2></header>
        <main style={{...scrollableContent, padding: '20px'}}>
          <div style={selectorGrid}>
            <button onClick={() => setAba('noticia')} style={aba === 'noticia' ? selActive : selBase}>Notícia</button>
            <button onClick={() => setAba('guia')} style={aba === 'guia' ? selActive : selBase}>Guia</button>
            <button onClick={() => setAba('vaga')} style={aba === 'vaga' ? selActive : selBase}>Vaga</button>
            <button onClick={() => setAba('config')} style={aba === 'config' ? selActive : selBase}>Início</button>
            <button onClick={() => setAba('push')} style={aba === 'push' ? selActive : selBase}>Push Ads</button>
          </div>

          {aba === 'push' && (
              <div style={adminSection}>
                <h4 style={sectionAdminTitle}>🚀 Disparar Notificação em Massa</h4>
                <div style={{ background: '#222', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                  <span style={{ color: '#00ff00', fontSize: '13px' }}>
                    📢 <strong>{totalInscritos}</strong> dispositivos prontos para receber.
                  </span>
                </div>
                <input 
                  placeholder="Título" style={inStyle} value={pushForm.titulo} 
                  onChange={e => setPushForm({...pushForm, titulo: e.target.value})} 
                />
                <textarea 
                  placeholder="Mensagem" style={{ ...inStyle, height: '80px' }} 
                  value={pushForm.mensagem} onChange={e => setPushForm({...pushForm, mensagem: e.target.value})} 
                />
                <input 
                  placeholder="Link" style={inStyle} value={pushForm.link} 
                  onChange={e => setPushForm({...pushForm, link: e.target.value})} 
                />
                <button onClick={enviarPush} style={subBtn} disabled={enviando}>
                  {enviando ? "ENVIANDO..." : "DISPARAR AGORA"}
                </button>
              </div>
            )}
            {aba === 'config' ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                
                {/* SEÇÃO DO BANNER */}
                <div style={adminSection}>
                  <h4 style={sectionAdminTitle}>Banner de Anúncio</h4>
                  <input placeholder="Título" style={inStyle} value={configHome.bannerTitulo} onChange={e=>setConfigHome({...configHome, bannerTitulo: e.target.value})} />
                  <input placeholder="Subtítulo" style={inStyle} value={configHome.bannerSub} onChange={e=>setConfigHome({...configHome, bannerSub: e.target.value})} />
                  <input placeholder="Link de Redirecionamento (Opcional)" style={inStyle} value={configHome.bannerLink} onChange={e=>setConfigHome({...configHome, bannerLink: e.target.value})} />
                  
                  <label style={{...drop, marginBottom: '10px', cursor: 'pointer'}}>
                    <Camera/> {bannerArquivo ? bannerArquivo.name : "Trocar Imagem do Anúncio"}
                    <input type="file" style={{display:'none'}} onChange={e=>setBannerArquivo(e.target.files[0])} />
                  </label>
                  
                  <button onClick={updateBanner} style={subBtn} disabled={enviando}>
                    {enviando ? "Salvando..." : "ATUALIZAR BANNER"}
                  </button>
                </div>
                <div style={adminSection}>
                  <h4 style={sectionAdminTitle}>Nova Utilidade Interativa</h4>
                  <input placeholder="Título (Ex: Ônibus de Caeté)" style={inStyle} value={configHome.utilNome} onChange={e=>setConfigHome({...configHome, utilNome: e.target.value})} />
                  <input placeholder="Subtítulo (Ex: Horários Atualizados)" style={inStyle} value={configHome.utilInfo} onChange={e=>setConfigHome({...configHome, utilInfo: e.target.value})} />
                  
                  <select style={{...inStyle, marginBottom: '15px'}} value={tipoUtil} onChange={e => setTipoUtil(e.target.value)}>
                    <option value="imagens">Carrossel de Imagens (Ônibus)</option>
                    <option value="telefones">Lista de Telefones Úteis</option>
                  </select>

                  {/* CAMPOS PARA IMAGENS */}
                  {tipoUtil === 'imagens' && (
                    <label style={{...drop, borderStyle: 'dashed', marginBottom: '15px', cursor: 'pointer'}}>
                      <Camera size={20}/> {arquivosUtil.length > 0 ? `${arquivosUtil.length} fotos selecionadas` : "Selecionar fotos dos horários"}
                      <input type="file" multiple style={{display:'none'}} accept="image/*" onChange={e=>setArquivosUtil(e.target.files)} />
                    </label>
                  )}

                  {/* CAMPOS PARA TELEFONES */}
                  {tipoUtil === 'telefones' && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px'}}>
                      {contatosUtil.map((c, idx) => (
                        <div key={idx} style={{display: 'flex', gap: '5px'}}>
                          <input placeholder="Nome" style={{...inStyle, flex: 1, marginBottom: 0}} value={c.nome} onChange={e => {
                            const newC = [...contatosUtil];
                            newC[idx].nome = e.target.value;
                            setContatosUtil(newC);
                          }} />
                          <input placeholder="Número" style={{...inStyle, flex: 1, marginBottom: 0}} value={c.numero} onChange={e => {
                            const newC = [...contatosUtil];
                            newC[idx].numero = e.target.value;
                            setContatosUtil(newC);
                          }} />
                        </div>
                      ))}
                      <button type="button" onClick={() => setContatosUtil([...contatosUtil, {nome: '', numero: ''}])} style={{background: '#222', color: '#fff', border: 'none', padding: '8px', borderRadius: '5px', fontSize: '12px', cursor: 'pointer'}}>
                        + Adicionar outro telefone
                      </button>
                    </div>
                  )}

                  <button type="button" onClick={addUtilidadeComplexa} style={subBtn} disabled={enviando}>
                    {enviando ? "Processando..." : "SALVAR UTILIDADE"}
                  </button>
                  
                  {/* LISTA DE UTILIDADES JÁ CADASTRADAS */}
                  <div style={{marginTop: '15px'}}>
                    {utilidadesAtuais.map((u, i) => (
                      <div key={i} style={utilListRow}>
                        <span style={{fontSize: '13px', color: '#fff'}}>{u.nome} - {u.info}</span>
                        <Trash2 size={16} color="#ff0000" onClick={() => deleteUtilidade(i)} style={{cursor:'pointer'}}/>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          ) : (
            <form onSubmit={handlePostGeral} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              {/* CAMPOS DINÂMICOS CONFORME A ABA */}
              {aba === 'noticia' && (
                <>
                  {/* NOVO SELETOR DE TIPO */}
                  <select 
                    style={inStyle} 
                    value={form.tipo} 
                    onChange={e => setForm({...form, tipo: e.target.value})}
                  >
                    <option value="feed">Notícia Normal (Feed)</option>
                    <option value="destaque">Notícia em DESTAQUE (Topo)</option>
                  </select>

                  <input 
                    placeholder="Título Principal" 
                    style={inStyle} 
                    value={form.titulo} 
                    onChange={e => setForm({...form, titulo: e.target.value})} 
                  />
                  
                  <textarea 
                    placeholder="Resumo" 
                    style={{...inStyle, height: '80px'}} 
                    value={form.resumo} 
                    onChange={e => setForm({...form, resumo: e.target.value})} 
                  />
                </>
              )}

              {aba === 'guia' && (
                <>
                  {/* FORMULÁRIO DE CADASTRO (O QUE JÁ EXISTIA) */}
                  <input placeholder="Nome da Empresa" style={inStyle} value={form.nome} onChange={e=>setForm({...form, nome: e.target.value})} />
                  <select style={inStyle} value={form.categoria} onChange={e=>setForm({...form, categoria: e.target.value})}>
                    <option value="Alimentação">🍔 Alimentação</option>
                    <option value="Saúde">💊 Saúde</option>
                    <option value="Serviços">🛠 Serviços</option>
                    <option value="Lojas">🛒 Lojas</option>
                  </select>
                  <input placeholder="WhatsApp (Com DDD)" style={inStyle} value={form.whatsapp} onChange={e=>setForm({...form, whatsapp: e.target.value})} />
                  
                  <label style={drop}>
                    <Camera/> {arquivo ? arquivo.name : "Logo da Empresa"}
                    <input type="file" style={{display:'none'}} onChange={e=>setArquivo(e.target.files[0])} />
                  </label>
                  
                  <select style={inStyle} value={form.plano} onChange={e=>setForm({...form, plano: e.target.value})}>
                    <option value="basic">Plano Básico (Sem foto)</option>
                    <option value="premium">Plano Premium (Com foto circular)</option>
                  </select>
                  
                  <button onClick={addEmpresa} style={subBtn}>CADASTRAR EMPRESA</button>

                  {/* LISTA DE EXCLUSÃO - ADICIONADA AQUI */}
                  <div style={{ marginTop: '30px' }}>
                    <h4 style={sectionAdminTitle}>Empresas Cadastradas</h4>
                    {guia.map((emp) => (
                      <div key={emp.id} style={{
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px', 
                        background: '#111', 
                        borderRadius: '8px', 
                        marginBottom: '8px',
                        border: '1px solid #222'
                      }}>
                        <div>
                          <strong style={{ color: '#fff', display: 'block' }}>{emp.nome}</strong>
                          <span style={{ color: '#666', fontSize: '12px' }}>{emp.categoria}</span>
                        </div>
                        
                        <Trash2 
                          size={18} 
                          color="#ff0000" 
                          style={{ cursor: 'pointer' }} 
                          onClick={() => deleteEmpresa(emp.id)} 
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {aba === 'vaga' && (
                <>
                  <input placeholder="Título da Vaga" style={inStyle} value={form.titulo} onChange={e=>setForm({...form, titulo: e.target.value})} />
                  <input placeholder="Empresa" style={inStyle} value={form.empresa} onChange={e=>setForm({...form, empresa: e.target.value})} />
                  <textarea placeholder="Descrição" style={{...inStyle, height: '80px'}} value={form.descricao} onChange={e=>setForm({...form, descricao: e.target.value})} />
                </>
              )}

              {aba !== 'vaga' && (
                <label style={drop}>
                  <Camera/> {arquivo ? arquivo.name : "Selecionar Foto"}
                  <input type="file" style={{display:'none'}} onChange={e=>setArquivo(e.target.files[0])} />
                </label>
              )}
              
              <button type="submit" style={subBtn}>PUBLICAR AGORA</button>
            </form>
          )}
          <Link to="/" style={{textAlign:'center', color:'#666', marginTop: '20px', display: 'block'}}>Voltar ao App</Link>
        </main>
      </div>
    </div>
  );
}

// --- ESTILOS (UNIFICADOS PARA CORREÇÃO DE LARGURA) ---
const globalWrapper = { 
  background: '#000000', 
  minHeight: '100vh', 
  width: '100vw', 
  display: 'flex', 
  justifyContent: 'center', 
  margin: 0, 
  padding: 0,
  overflowX: 'hidden',
  fontFamily: '"Helvetica", Times, serif',
};

const appContainer = { 
  width: '100%', 
  maxWidth: '480px', // Trava a largura máxima para parecer um celular centralizado
  height: '100vh', 
  background: '#000', 
  display: 'flex', 
  flexDirection: 'column', 
  position: 'relative', 
  overflow: 'hidden',
  boxSizing: 'border-box',
  boxShadow: '0 0 50px rgba(0,0,0,0.5)',
};

const headerStyle = { 
  width: '100%', 
  padding: '10px', 
  display: 'flex', 
  justifyContent: 'center', 
  borderBottom: '2px solid #ff0000', 
  background: '#000', 
  flexShrink: 0,
  boxSizing: 'border-box'
};

const logoImgStyle = { height: '38px', objectFit: 'contain' };

const scrollableContent = { 
  flex: 1, 
  overflowY: 'auto', 
  paddingBottom: '80px', 
  width: '100%',
  boxSizing: 'border-box' 
};

const contentPadding = { 
  padding: '15px', 
  width: '100%',
  boxSizing: 'border-box' 
};

const bottomNav = { 
  position: 'absolute', 
  bottom: 0, 
  left: 0,
  right: 0,
  height: '65px', 
  display: 'flex', 
  background: '#0a0a0a', 
  borderTop: '1px solid #222',
  boxSizing: 'border-box',
  zIndex: 1000
};

const navBtnStyle = { 
  flex: 1, 
  background: 'none', 
  border: 'none', 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  justifyContent: 'center', 
  gap: '4px', 
  cursor: 'pointer' 
};

const sectionTitle = { 
  fontSize: '18px', 
  fontWeight: '700', 
  margin: '25x 0 15px 0', 
  borderLeft: '4px solid #ff0000', 
  paddingLeft: '10px',
  color: '#fff',
  borderBottom: '1px solid #333',
  paddingBottom: '8px',
  letterSpacing: '0.5px',
};

const superBannerAd = { 
  background: 'linear-gradient(45deg, #ff0000, #cc0000)', 
  padding: '18px', 
  borderRadius: '12px', 
  marginBottom: '18px', 
  position: 'relative', 
  width: '100%',
  boxSizing: 'border-box' 
};

const adLabel = { position: 'absolute', top: '5px', right: '10px', fontSize: '9px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' };
const heroNewsCard = { position: 'relative', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '15px', width: '100%' };
const heroImg = { width: '100%', height: '100%', objectFit: 'cover' };
const heroGradient = { position: 'absolute', bottom: 0, width: '100%', padding: '15px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', boxSizing: 'border-box' };
const quickLinksGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' };
const quickLinkItem = { background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #222', boxSizing: 'border-box' };
const newsRow = { display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #111', width: '100%', boxSizing: 'border-box' };
const newsThumb = { width: '90px', height: '65px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 };
const newsContent = { flex: 1 };
const newsCategory = { fontSize: '9px', fontWeight: 'bold', color: '#ff0000' };
const newsTitleCompact = { margin: '4px 0', fontSize: '13px', fontWeight: '700', lineHeight: '1.4', color: '#fff' };
const newsDate = { fontSize: '10px', color: '#666' };
const premiumBusinessCard = { display: 'flex', gap: '15px', background: '#0f0f0f', padding: '15px', borderRadius: '12px', border: '1px solid #ff0000', marginBottom: '15px', width: '100%', boxSizing: 'border-box' };
const businessThumb = { width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 };
const businessCat = { fontSize: '10px', color: '#ff0000', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', display: 'block' };
const businessName = { margin: '0 0 10px 0', fontSize: '16px', fontWeight: '800', color: '#fff' };
const businessActions = { display: 'flex', gap: '8px', marginTop: '10px' };
const actionBtnZap = { flex: 1, padding: '10px', background: '#25D366', borderRadius: '8px', color: '#fff', textAlign: 'center', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' };
const actionBtnCall = { flex: 1, padding: '10px', background: '#333', borderRadius: '8px', color: '#fff', textAlign: 'center', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' };
const standardBusinessRow = { padding: '15px', background: '#0a0a0a', borderRadius: '12px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' };const jobCard = { background: '#111', padding: '20px', borderRadius: '15px', borderLeft: '4px solid #ff0000', marginBottom: '20px', width: '100%', boxSizing: 'border-box' };
const jobBtn = { marginTop: '15px', width: '100%', padding: '15px', background: '#ff0000', borderRadius: '10px', color: '#fff', fontWeight: 'bold', display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' };const inStyle = { width: '100%', padding: '12px', borderRadius: '8px', background: '#111', border: '1px solid #333', color: '#fff', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' };
const selectorGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '25px', width: '100%' };
const selBase = { padding: '10px 0', background: '#111', color: '#888', border: 'none', borderRadius: '6px', fontSize: '11px' };
const selActive = { ...selBase, background: '#ff0000', color: '#fff', fontWeight: 'bold' };
const drop = { width: '100%', padding: '20px', border: '2px dashed #333', borderRadius: '12px', textAlign: 'center', color: '#666', boxSizing: 'border-box' };
const subBtn = { width: '100%', padding: '14px', background: '#ff0000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const adminSection = { border: '1px solid #222', padding: '15px', borderRadius: '12px', background: '#050505', width: '100%', boxSizing: 'border-box', marginBottom: '20px' };
const sectionAdminTitle = { margin: '0 0 15px 0', color: '#ff0000', fontSize: '11px', textTransform: 'uppercase' };
const utilListRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#111', borderRadius: '6px', marginTop: '5px', width: '100%', boxSizing: 'border-box' };

const searchBar = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px', 
  background: '#111', 
  padding: '12px 15px', 
  borderRadius: '10px', 
  border: '1px solid #222',
  width: '100%',
  boxSizing: 'border-box'
};

const searchInput = { 
  background: 'none', 
  border: 'none', 
  color: '#fff', 
  outline: 'none', 
  flex: 1,
  fontSize: '14px'
};
// --- ROTAS DO APP ---
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicApp />} />
        <Route path="/portal-admin-caete" element={<AdminPortal />} />
      </Routes>
    </Router>
  );
}