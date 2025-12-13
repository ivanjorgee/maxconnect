/* Simple CSV importer for MaximosConect.
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
  const [headerLine, ...rows] = content.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  return rows
    .map((row) => row.split(","))
    .map((cols) =>
      headers.reduce((acc, header, idx) => {
        acc[header] = cols[idx] ? cols[idx].trim() : "";
        return acc;
      }, {}),
    );
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
