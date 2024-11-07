import json
import yaml

# Carregar dados JSON
with open('json.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Verificar se a chave "intenções" existe
if "intenções" not in data:
    raise ValueError("O arquivo JSON deve conter uma chave 'intenções'.")

# Criar estrutura de dados para os arquivos Rasa
intents = []
responses = {}

for item in data["intenções"]:
    # Substituir 'etiqueta' por 'tag' se a chave 'tag' não existir
    if 'tag' not in item and 'etiqueta' in item:
        item['tag'] = item['etiqueta']
    
    # Verificar se o item contém as chaves "tag", "padrões" e "respostas"
    if not all(k in item for k in ["tag", "padrões", "respostas"]):
        print("Erro no item:", item)  # Exibe o item problemático para facilitar a depuração
        raise ValueError("Cada intenção deve conter as chaves 'tag', 'padrões' e 'respostas'.")

    # Adicionar exemplos de intenção
    intents.append({
        "intent": item["tag"],
        "examples": "\n".join([f"- {ex}" for ex in item["padrões"]])
    })

    # Adicionar respostas ao domínio
    responses[f"utter_{item['tag']}"] = [{"text": resp} for resp in item["respostas"]]

# Salvar o arquivo nlu.yml
with open("nlu.yml", "w", encoding='utf-8') as nlu_file:
    yaml.dump({"nlu": intents}, nlu_file, allow_unicode=True)

# Salvar o arquivo domain.yml
domain_data = {
    "version": "2.0",
    "intents": [item["tag"] for item in data["intenções"]],
    "responses": responses
}

with open("domain.yml", "w", encoding='utf-8') as domain_file:
    yaml.dump(domain_data, domain_file, allow_unicode=True)

print("Arquivos nlu.yml e domain.yml foram gerados com sucesso!")
