(function () {
  var cfg = window.NS_CONFIG;
  var TIPOS = ["A-", "A+", "B-", "B+", "AB-", "AB+", "O-", "O+"];

  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function mock(caminho, opts) {
    var corpo = opts.body ? JSON.parse(opts.body) : {};
    return espera(250).then(function () {
      if (caminho === "/auth/login") return { token: "mock", usuario: { nome: "Operador", email: corpo.email } };
      if (caminho === "/estoque") {
        var e = {}; TIPOS.forEach(function (t) { e[t] = Math.round(8 + Math.random() * 60); }); return e;
      }
      if (caminho === "/camara-fria") return { temperatura: 1, refrigeracao: false, umidade: 100 };
      if (caminho === "/alertas") return { ok: true };
      if (caminho === "/doadores" || caminho === "/doacoes" || caminho === "/usuarios") return { ok: true };
      if (caminho.indexOf("/doadores/") === 0) {
        var cpf = decodeURIComponent(caminho.split("/")[2]).replace(/\D/g, "");
        if (cpf.length !== 11) throw new Error("Doador não encontrado");
        return { nome: "Doador de Exemplo", cpf: cpf, rg: "00.000.000-0", nascimento: "1995-05-20" };
      }
      if (caminho.indexOf("/relatorios") === 0) {
        var p = new URLSearchParams(caminho.split("?")[1]);
        var linhas = [];
        for (var i = 1; i <= 6; i++) linhas.push(["Semana " + i, Math.round(20 + Math.random() * 40), Math.round(5 + Math.random() * 20)]);
        return { titulo: p.get("tipo"), colunas: ["Período", "Valor", "Variação (%)"], linhas: linhas };
      }
      throw new Error("Rota não encontrada");
    });
  }

  function requisicao(caminho, opts) {
    opts = opts || {};
    if (cfg.USAR_MOCK) return mock(caminho, opts);
    var token = sessionStorage.getItem("ns_token");
    var headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    return fetch(cfg.API_URL + caminho, Object.assign({ headers: headers }, opts)).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          throw new Error(j.mensagem || "Erro " + res.status);
        });
      }
      return res.json();
    });
  }

  function post(c, dados) { return requisicao(c, { method: "POST", body: JSON.stringify(dados) }); }

  window.NS_API = {
    TIPOS: TIPOS,
    login: function (email, senha) { return post("/auth/login", { email: email, senha: senha }); },
    estoque: function () { return requisicao("/estoque"); },
    camaraFria: function () { return requisicao("/camara-fria"); },
    enviarAlerta: function (tipos) { return post("/alertas", { tipos: tipos }); },
    cadastrarDoador: function (d) { return post("/doadores", d); },
    buscarDoador: function (cpf) { return requisicao("/doadores/" + encodeURIComponent(cpf)); },
    registrarDoacao: function (d) { return post("/doacoes", d); },
    relatorio: function (tipo, ini, fim) {
      return requisicao("/relatorios?" + new URLSearchParams({ tipo: tipo, inicio: ini, fim: fim }));
    },
    cadastrarUsuario: function (u) { return post("/usuarios", u); }
  };
})();
