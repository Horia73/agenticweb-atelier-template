/* Conținutul site-ului, într-un singur loc — agentul îl rescrie din brieful
   clientului (nume, servicii, contact din chestionar). Pagina și componentele
   citesc DOAR de aici, ca schimbarea conținutului să nu ceară atins layout-ul. */

export const site = {
  name: "Numele Firmei",
  tagline: "sloganul tău, pe scurt",
  description:
    "Descrierea firmei pentru motoarele de căutare — ce faci și pentru cine.",
  phone: "07xx xxx xxx",
  email: "contact@firma.ro",
  address: "Str. Exemplu 1, Oraș",
  hours: "Luni–Vineri, 9:00–18:00",

  hero: {
    eyebrow: "Bine ai venit",
    title: "Un titlu care spune clar ce oferi.",
    subtitle:
      "Un rând-două care conving vizitatorul să rămână și să ia legătura cu tine.",
    ctaPrimary: "Contactează-ne",
    ctaSecondary: "Vezi serviciile",
  },

  services: [
    {
      title: "Serviciul unu",
      description: "O propoziție care explică ce presupune și ce câștigă clientul.",
    },
    {
      title: "Serviciul doi",
      description: "O propoziție care explică ce presupune și ce câștigă clientul.",
    },
    {
      title: "Serviciul trei",
      description: "O propoziție care explică ce presupune și ce câștigă clientul.",
    },
  ],

  about: {
    title: "Despre noi",
    body:
      "Câteva rânduri despre cine sunteți, de cât timp și de ce v-ar alege un client pe voi. Concret, cald, fără clișee.",
  },
};
