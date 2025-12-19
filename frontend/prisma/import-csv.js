/* Simple CSV importer for Maxconect Crm.
   Usage: CSV_PATH=./clinicas.csv node prisma/import-csv.js
   Expected headers (case-insensitive):
   nome,endereco,cidade,telefone,whatsapp,website,avaliacaoGoogle,qtdAvaliacoes,linkGoogleMaps,origemLead,canalPrincipal,tipoSite */

const fs = require("fs");
const path = require("path");
const {
  PrismaClient,
  OrigemLead,
  Canal,
  TipoSite,
  StatusFunil,
  Prioridade,
} = require("@prisma/client");

const prisma = new PrismaClient();

function parseCsv(content) {
  const rows = parseCsvRows(content);
  if (!rows.length) return [];
  const headers = rows
    .shift()
    .map((h) => h.replace(/^\uFEFF/, "").trim().toLowerCase());
  return rows
    .filter((row) => row.some((value) => value.trim().length))
    .map((cols) =>
      headers.reduce((acc, header, idx) => {
        acc[header] = cols[idx] ? cols[idx].trim() : "";
        return acc;
      }, {}),
    );
}

function parseCsvRows(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(field);
      field = "";
      if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

async function main() {
  const filePath = process.env.CSV_PATH || process.argv[2];
  if (!filePath) {
    console.log("Informe CSV_PATH ou passe o caminho do CSV como argumento.");
    return;
  }
  const resolved = path.resolve(filePath);
  const raw = fs.readFileSync(resolved, "utf8");
  const rows = parseCsv(raw);

  for (const row of rows) {
    const nome = row.nome || row["nome da empresa"];
    if (!nome) continue;
    const origem = (row.origemlead || row.origemalead || "").toUpperCase();
    const canal = (row.canalprincipal || "").toUpperCase();
    const tipoSite = (row.tiposite || "").toUpperCase();

    await prisma.empresa.create({
      data: {
        nome,
        endereco: row.endereco || "Endereço não informado",
        cidade: row.cidade || "",
        telefonePrincipal: row.telefone || "",
        whatsapp: row.whatsapp || "",
        website: row.website || "",
        avaliacaoGoogle: row.avaliacaogoogle ? Number(row.avaliacaogoogle) : null,
        qtdAvaliacoes: row.qtdavaliacoes ? Number(row.qtdavaliacoes) : null,
        linkGoogleMaps: row.linkgooglemaps || "",
        origemLead: OrigemLead[origem] || OrigemLead.GOOGLE_MAPS,
        canalPrincipal: Canal[canal] || Canal.WHATSAPP,
        temSite: row.website ? true : false,
        tipoSite: TipoSite[tipoSite] || TipoSite.NENHUM,
        prioridade: Prioridade.MEDIA,
        statusFunil: StatusFunil.NOVO,
        tags: [],
      },
    });
  }

  console.log(`Importação concluída: ${rows.length} linhas processadas.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
