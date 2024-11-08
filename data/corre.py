import re

# Caminho do arquivo YAML
arquivo = r'C:\Users\manuel\Desktop\chatbot\Saude_Mental_Baseada_Em_Chat\data\domain.yml'

# Função de decodificação segura
def decodificar_seguro(texto):
    try:
        # Primeiro, tenta decodificar a sequência hexadecimal
        return bytes.fromhex(texto.group()[2:]).decode('latin1').encode('utf-8').decode('utf-8')
    except UnicodeDecodeError:
        # Se falhar, tenta decodificar com a codificação latin1 e depois para UTF-8
        return texto.group()

# Função de correção para decodificar sequências erradas de caracteres
def corrigir_codificacao(texto):
    # Usando uma expressão regular para encontrar sequências de bytes em hexadecimal (por exemplo, \xE3, \xA7, etc.)
    texto_corrigido = re.sub(r'\\x[a-fA-F0-9]{2}', decodificar_seguro, texto)
    # Tenta corrigir caracteres mal interpretados (como 'Ã£' para 'ão') ao decodificar novamente
    return texto_corrigido.encode('latin1').decode('utf-8', errors='ignore')

# Lê o arquivo e corrige a codificação
with open(arquivo, 'r', encoding='utf-8') as file:
    conteudo = file.read()

# Corrige a codificação do conteúdo
conteudo_corrigido = corrigir_codificacao(conteudo)

# Salva o arquivo corrigido
with open(arquivo, 'w', encoding='utf-8') as file:
    file.write(conteudo_corrigido)

print("Arquivo corrigido e salvo com sucesso!")
