export interface Video {
  id: string
  title: string
  thumbnail: string
  duration: string
  channel: {
    name: string
    avatar: string
    verified: boolean
  }
  views: string
  uploadedAt: string
  category: string
  isLive?: boolean
}

export interface Channel {
  id: string
  name: string
  avatar: string
  subscribers?: string
  hasNotification?: boolean
}

export const categories = [
  "All",
  "Boy",
  "Girl",
  "Show",
  "Little",
  "Pussy",
  "Teen",
  "Dick",
  "Cum",
  "Anal",
  "Brother",
]

export const subscribedChannels: Channel[] = [
  { id: "1", name: "Luccas Carlos", avatar: "https://i.pravatar.cc/150?img=1", hasNotification: false },
  { id: "2", name: "MC Negão Original", avatar: "https://i.pravatar.cc/150?img=2", hasNotification: false },
  { id: "3", name: "TrapLaudo", avatar: "https://i.pravatar.cc/150?img=3", hasNotification: false },
  { id: "4", name: "MC Ryan SP", avatar: "https://i.pravatar.cc/150?img=4", hasNotification: true },
  { id: "5", name: "MC Lele JP", avatar: "https://i.pravatar.cc/150?img=5", hasNotification: true },
  { id: "6", name: "Mc Paiva ZS", avatar: "https://i.pravatar.cc/150?img=6", hasNotification: false },
  { id: "7", name: "MC IG", avatar: "https://i.pravatar.cc/150?img=7", hasNotification: true },
]

export const videos: Video[] = [
  {
    id: "1",
    title: "ESTOURE O BALÃO OU ENCONTRE SEU AMOR! EP:51",
    thumbnail: "https://picsum.photos/seed/video1/640/360",
    duration: "31:04",
    channel: {
      name: "PEIXE",
      avatar: "https://i.pravatar.cc/150?img=10",
      verified: true,
    },
    views: "112 mil visualizações",
    uploadedAt: "há 4 horas",
    category: "Comédia",
  },
  {
    id: "2",
    title: "Mix de PIX OU PRESENTE 2 - Jvila, Paulin, Kelvinho, Ryan SP, GP, Negão Original",
    thumbnail: "https://picsum.photos/seed/video2/640/360",
    duration: "45:20",
    channel: {
      name: "MC Paulin da Capital",
      avatar: "https://i.pravatar.cc/150?img=11",
      verified: true,
    },
    views: "2,3 mi visualizações",
    uploadedAt: "há 2 semanas",
    category: "Música",
  },
  {
    id: "3",
    title: "DIA DE VAQUEJADA COM NATHAN QUEIROZ",
    thumbnail: "https://picsum.photos/seed/video3/640/360",
    duration: "1:24:30",
    channel: {
      name: "Jon Vlogs",
      avatar: "https://i.pravatar.cc/150?img=12",
      verified: true,
    },
    views: "3,5 mil assistindo",
    uploadedAt: "",
    category: "Ao vivo",
    isLive: true,
  },
  {
    id: "4",
    title: "instalei o sistema da coreia do norte e fui espionado",
    thumbnail: "https://picsum.photos/seed/video4/640/360",
    duration: "16:20",
    channel: {
      name: "Milkurtz",
      avatar: "https://i.pravatar.cc/150?img=13",
      verified: true,
    },
    views: "193 mil visualizações",
    uploadedAt: "há 3 dias",
    category: "Tecnologia",
  },
  {
    id: "5",
    title: "VEM COM A TOP BRASIL SVD!!",
    thumbnail: "https://picsum.photos/seed/video5/640/360",
    duration: "",
    channel: {
      name: "NEW EVELIN",
      avatar: "https://i.pravatar.cc/150?img=14",
      verified: false,
    },
    views: "5 assistindo",
    uploadedAt: "",
    category: "Jogos",
    isLive: true,
  },
  {
    id: "6",
    title: "Mix de PROBLEMAS DE AMOR - LIL KID, TRAPLAUDO, MC MENO K (CLIPE OFICIAL)",
    thumbnail: "https://picsum.photos/seed/video6/640/360",
    duration: "28:45",
    channel: {
      name: "Lil Kid 777",
      avatar: "https://i.pravatar.cc/150?img=15",
      verified: false,
    },
    views: "890 mil visualizações",
    uploadedAt: "há 1 mês",
    category: "Música",
  },
  {
    id: "7",
    title: "REACT: OS MELHORES MEMES DA INTERNET BRASILEIRA",
    thumbnail: "https://picsum.photos/seed/video7/640/360",
    duration: "22:15",
    channel: {
      name: "Ei Nerd",
      avatar: "https://i.pravatar.cc/150?img=16",
      verified: true,
    },
    views: "1,2 mi visualizações",
    uploadedAt: "há 1 semana",
    category: "Comédia",
  },
  {
    id: "8",
    title: "NOVO MACBOOK PRO M4 - Vale a pena? Análise Completa",
    thumbnail: "https://picsum.photos/seed/video8/640/360",
    duration: "18:42",
    channel: {
      name: "Tecmundo",
      avatar: "https://i.pravatar.cc/150?img=17",
      verified: true,
    },
    views: "456 mil visualizações",
    uploadedAt: "há 5 dias",
    category: "Tecnologia",
  },
  {
    id: "9",
    title: "BRASILEIRÃO 2024 - Melhores Gols da Rodada 35",
    thumbnail: "https://picsum.photos/seed/video9/640/360",
    duration: "12:30",
    channel: {
      name: "Esporte Interativo",
      avatar: "https://i.pravatar.cc/150?img=18",
      verified: true,
    },
    views: "2,1 mi visualizações",
    uploadedAt: "há 2 dias",
    category: "Esportes",
  },
  {
    id: "10",
    title: "PODCAST: Histórias de Terror Reais - EP 127",
    thumbnail: "https://picsum.photos/seed/video10/640/360",
    duration: "1:45:22",
    channel: {
      name: "Mundo Mistério",
      avatar: "https://i.pravatar.cc/150?img=19",
      verified: true,
    },
    views: "678 mil visualizações",
    uploadedAt: "há 1 dia",
    category: "Podcasts",
  },
  {
    id: "11",
    title: "GTA 6 - Todos os DETALHES do Novo Trailer!",
    thumbnail: "https://picsum.photos/seed/video11/640/360",
    duration: "25:18",
    channel: {
      name: "BRKsEDU",
      avatar: "https://i.pravatar.cc/150?img=20",
      verified: true,
    },
    views: "3,4 mi visualizações",
    uploadedAt: "há 3 semanas",
    category: "Jogos",
  },
  {
    id: "12",
    title: "VIAGEM COMPLETA: 10 Dias no Nordeste Brasileiro",
    thumbnail: "https://picsum.photos/seed/video12/640/360",
    duration: "42:55",
    channel: {
      name: "Estevam Pelo Mundo",
      avatar: "https://i.pravatar.cc/150?img=21",
      verified: true,
    },
    views: "1,8 mi visualizações",
    uploadedAt: "há 2 meses",
    category: "Turismo",
  },
]

export const suggestedVideos: Video[] = [
  {
    id: "s1",
    title: "MC Ryan SP - Berimbau Descontrolado (Clipe Oficial)",
    thumbnail: "https://picsum.photos/seed/suggested1/320/180",
    duration: "3:45",
    channel: {
      name: "MC Ryan SP",
      avatar: "https://i.pravatar.cc/150?img=22",
      verified: true,
    },
    views: "15 mi visualizações",
    uploadedAt: "há 3 meses",
    category: "Música",
  },
  {
    id: "s2",
    title: "REAGINDO aos FUNKS mais TOCADOS de 2024",
    thumbnail: "https://picsum.photos/seed/suggested2/320/180",
    duration: "28:12",
    channel: {
      name: "Funk TV",
      avatar: "https://i.pravatar.cc/150?img=23",
      verified: true,
    },
    views: "4,2 mi visualizações",
    uploadedAt: "há 1 mês",
    category: "Música",
  },
  {
    id: "s3",
    title: "Tutorial: Como Fazer um Beat de Funk no FL Studio",
    thumbnail: "https://picsum.photos/seed/suggested3/320/180",
    duration: "45:30",
    channel: {
      name: "Producer BR",
      avatar: "https://i.pravatar.cc/150?img=24",
      verified: false,
    },
    views: "892 mil visualizações",
    uploadedAt: "há 2 semanas",
    category: "Música",
  },
  {
    id: "s4",
    title: "Os 10 Carros Mais Rápidos do Brasil",
    thumbnail: "https://picsum.photos/seed/suggested4/320/180",
    duration: "15:22",
    channel: {
      name: "AutoEsporte",
      avatar: "https://i.pravatar.cc/150?img=25",
      verified: true,
    },
    views: "2,3 mi visualizações",
    uploadedAt: "há 1 semana",
    category: "Carros",
  },
  {
    id: "s5",
    title: "MINECRAFT mas EU SOU UM GIGANTE",
    thumbnail: "https://picsum.photos/seed/suggested5/320/180",
    duration: "22:45",
    channel: {
      name: "AuthenticGames",
      avatar: "https://i.pravatar.cc/150?img=26",
      verified: true,
    },
    views: "5,6 mi visualizações",
    uploadedAt: "há 4 dias",
    category: "Jogos",
  },
]
