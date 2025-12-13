import { PrismaClient, LeadChannel, LeadStatus } from "@prisma/client";

const prisma = new PrismaClient();

type RawLead = {
  name: string;
  address?: string;
  phone?: string;
  website?: string | null;
  rating?: number | null;
  reviews?: number | null;
  mapUrl?: string;
};

const leads: RawLead[] = [
  {
    name: "Clinica Empoderatti",
    address: "Av. Conselheiro Furtado, 1679 - Cremação, Belém - PA, 66040-100",
    phone: "(91) 3225-4596",
    website: "clinicaempoderatti.com.br",
    rating: 5.0,
    reviews: 7,
    mapUrl: "https://maps.app.goo.gl/RbNjppZFqU6fPTax5",
  },
  {
    name: "Bellaforma – Clínica de Estética em Belém",
    address: "Av. Duque de Caxias, 1035 - Marco, Belém - PA, 66093-029",
    phone: "(91) 3226-1386",
    website: "clinicabellaforma.com.br",
    rating: 4.3,
    reviews: 100,
    mapUrl: "https://maps.app.goo.gl/S4tcVrXDkbxQhLnD7",
  },
  {
    name: "VIRTUOSA CLÍNICA ESTÉTICA",
    address: "Tv. Alm. Wandenkolk, 1020 - Umarizal, Belém - PA, 66055-030",
    phone: "(91) 99364-8375",
    website: null,
    rating: 4.9,
    reviews: 368,
    mapUrl: "https://maps.app.goo.gl/YaPKNaNJGt2f9uat9",
  },
  {
    name: "Miss Bela Exclusive",
    address: "Tv. Alferes Costa, 2747 - Marco, Belém - PA, 66095-540",
    phone: "(91) 98240-9890",
    website: null,
    rating: 4.9,
    reviews: 156,
    mapUrl: "https://maps.app.goo.gl/zcXs9RiF8z8Ch6L27",
  },
  {
    name: "La Vanité Medicina e Estética",
    address: "Tv. Pirajá, 1276 - Marco, Belém - PA, 66087-490",
    phone: "(91) 98210-0723",
    website: null,
    rating: 5.0,
    reviews: 190,
    mapUrl: "https://maps.app.goo.gl/bXLWbdYMJLMutozH8",
  },
  {
    name: "Clínica Curativa – Estética Avançada Facial e Corporal",
    address: "Rod. Augusto Montenegro, 4300 - Parque Office, Belém - PA, 66635-110",
    phone: "(91) 98523-2362",
    website: "linktr.ee",
    rating: 4.7,
    reviews: 15,
    mapUrl: "https://maps.app.goo.gl/6aEXWwVn9KN5zh8",
  },
  {
    name: "Clínica Dra Grace Melo",
    address: "Av. Tavares Bastos, nº 1430 - Marambaia, Belém - PA, 66615-005",
    phone: "(91) 99389-6064",
    website: null,
    rating: null,
    reviews: 0,
    mapUrl: "https://maps.app.goo.gl/LQqCkd271JKJkKDU9",
  },
  {
    name: "Locus Amoenus Estética Integrativa",
    address: "Passagem São Jorge, Nº 31 - Marambaia, Belém - PA, 66615-550",
    phone: "(91) 99180-9507",
    website: null,
    rating: null,
    reviews: 0,
    mapUrl: "https://maps.app.goo.gl/Ze9iXw3jbZmDRA9",
  },
  {
    name: "Raiza Araújo – Estética Avançada",
    address: "Av. Tavares Bastos, 1338 - Marambaia, Belém - PA, 66615-055",
    phone: "(91) 98273-5159",
    website: null,
    rating: 5.0,
    reviews: 9,
    mapUrl: "https://maps.app.goo.gl/u8RynWVp7poLSRd9",
  },
  {
    name: "Enzimas Belém",
    address: "Tv. Humaitá, 1878 - Marco, Belém - PA, 66093-048",
    phone: "(91) 98507-6323",
    website: null,
    rating: 4.9,
    reviews: 144,
    mapUrl: "https://maps.app.goo.gl/4qSziGvYFH1DtLnH",
  },
  {
    name: "Beauty Estética",
    address: "Av. Alm. Barroso, 1393 - Marco, Belém - PA, 66093-020",
    phone: "(91) 99604-0003",
    website: null,
    rating: 4.6,
    reviews: 20,
    mapUrl: "https://maps.app.goo.gl/XaTvo7TrWzjAX4xTJ7",
  },
  {
    name: "Clínica de Estética Espaço Vitta – Beleza e Bem-Estar – Belém",
    address: "Infinity Corporate Center – Tv. Barão do Triunfo, 3540A – sala 312 – Marco, Belém - PA, 66095-055",
    phone: "(91) 98053-2335",
    website: null,
    rating: 5.0,
    reviews: 63,
    mapUrl: "https://maps.app.goo.gl/B8HArxTMuSRxmVFDB",
  },
  {
    name: "Clínica Gold – Belém",
    address: "Edifício Village Office - R. Antônio Barreto, 130 - Sala 1106 - Umarizal, Belém - PA, 66055-050",
    phone: "(91) 98506-4644",
    website: null,
    rating: 4.8,
    reviews: 136,
    mapUrl: "https://maps.app.goo.gl/QXZjcGRAT77HP5x6A",
  },
  {
    name: "Clínica Iandê – Saúde e Estética Belém",
    address: "Tv. Quatorze de Abril, 1939 – Fátima, Belém – PA, 66063-475",
    phone: "(91) 98886-1718",
    website: null,
    rating: 4.9,
    reviews: 117,
    mapUrl: "https://maps.app.goo.gl/8qX1fFwkoup5nNJ8",
  },
  {
    name: "Harmoniz Belém – Clínica de Estética em Belém Pará",
    address: "Edifício Connext Office – R. Domingos Marreiros, 1560 – sala 1208 – Umarizal, Belém – PA, 66055-200",
    phone: undefined,
    website: "instagram.com",
    rating: 5.0,
    reviews: 9,
    mapUrl: "https://maps.app.goo.gl/wrJGB4iST4SzvMb6",
  },
];

const normalizePhone = (phone?: string) => {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
};

const extractCity = (address?: string) => {
  if (!address) return undefined;
  const match = address.match(/Belém\s*-\s*PA/i);
  return match ? match[0] : "Belém - PA";
};

async function main() {
  for (const raw of leads) {
    const whatsapp = normalizePhone(raw.phone);
    const channel: LeadChannel = whatsapp ? "WHATSAPP" : raw.website?.includes("instagram") ? "INSTAGRAM" : "OUTRO";
    const contact =
      (whatsapp ? `whatsapp:${whatsapp}` : undefined) ||
      (raw.website?.includes("instagram") ? "instagram.com" : raw.website) ||
      "Contato não encontrado";

    const existing = await prisma.lead.findFirst({
      where: {
        name: raw.name,
        ownerId: 1,
      },
    });

    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data: {
          contact,
          channel,
          status: LeadStatus.MANDADO,
          whatsapp,
          instagram: raw.website?.includes("instagram") ? raw.website : undefined,
          website: raw.website && raw.website !== "N/A" ? raw.website : undefined,
          address: raw.address,
          city: extractCity(raw.address),
          rating: raw.rating ?? undefined,
          reviews: raw.reviews ?? undefined,
          mapUrl: raw.mapUrl,
        },
      });
    } else {
      await prisma.lead.create({
        data: {
          name: raw.name,
          contact,
          channel,
          status: LeadStatus.MANDADO,
          whatsapp,
          instagram: raw.website?.includes("instagram") ? raw.website : undefined,
          website: raw.website && raw.website !== "N/A" ? raw.website : undefined,
          address: raw.address,
          city: extractCity(raw.address),
          rating: raw.rating ?? undefined,
          reviews: raw.reviews ?? undefined,
          mapUrl: raw.mapUrl,
          ownerId: 1,
        },
      });
    }
  }

  console.log("Leads de Belém importados/atualizados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
