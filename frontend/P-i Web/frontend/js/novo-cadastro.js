NS_UI.navbar("cadastro");
var $ = function (id) { return document.getElementById(id); };
NS_UI.mascaraCpf($("cpf")); NS_UI.mascaraTelefone($("tel"));

$("form-cadastro").addEventListener("submit", function (e) {
  e.preventDefault();
  var u = {
    nome: $("nome").value.trim(), papel: $("papel").value, cpf: $("cpf").value, email: $("email").value.trim(),
    telefone: $("tel").value, senha: $("senha").value
  };
  if (!u.nome || !u.papel || !u.email || !u.telefone || !u.senha) return NS_UI.toast("Preencha todos os campos", "falha");
  if (!NS_UI.cpfValido(u.cpf)) return NS_UI.toast("CPF inválido", "falha");
  if (u.senha.length < 6) return NS_UI.toast("A senha precisa ter ao menos 6 caracteres", "falha");
  if (u.senha !== $("confirma").value) return NS_UI.toast("As senhas não coincidem", "falha");
  NS_API.cadastrarUsuario(u).then(function () {
    NS_UI.toast("Cadastro feito com sucesso!", "sucesso");
    $("form-cadastro").reset();
  }).catch(function (err) { NS_UI.toast(err.message || "Falha no cadastro", "falha"); });
});
