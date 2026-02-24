module.exports = [
  {
    id: "certfr-alertes",
    name: "CERT-FR - Alertes",
    type: "CERT-ALERTE",
    mode: "rss",
    url: "https://www.cert.ssi.gouv.fr/alerte/feed/"
  },
  {
    id: "certfr-avis",
    name: "CERT-FR - Avis",
    type: "CERT-AVIS",
    mode: "rss",
    url: "https://www.cert.ssi.gouv.fr/avis/feed/"
  },
  {
    id: "certfr-actualite",
    name: "CERT-FR - Bulletins",
    type: "CERT-ACTU",
    mode: "rss",
    url: "https://www.cert.ssi.gouv.fr/actualite/feed/"
  },
  {
    id: "certfr-ioc",
    name: "CERT-FR - IoC",
    type: "CERT-IOC",
    mode: "rss",
    url: "https://www.cert.ssi.gouv.fr/ioc/feed/"
  },
  {
    id: "certfr-durcissement",
    name: "CERT-FR - Durcissement",
    type: "CERT-DURCISSEMENT",
    mode: "rss",
    url: "https://www.cert.ssi.gouv.fr/durcissement/feed/"
  },
  {
    id: "cybermalveillance-actualites",
    name: "Cybermalveillance - Actualités",
    type: "CYBERMAL-ACTU",
    mode: "rss",
    url: "https://www.cybermalveillance.gouv.fr/feed/atom-flux-actualites"
  },
  {
    id: "viginum-guide-electoral",
    name: "SGDSN / Viginum - Guide débat public numérique",
    type: "GUIDE",
    mode: "pdf-watcher",
    url: "https://www.sgdsn.gouv.fr/files/files/guide-proteger-debat-public-numerique-contexte-electoral.pdf",
    staticMeta: {
      title: "Protéger le débat public numérique en contexte électoral",
      summary: "Guide gouvernemental sur les risques de manipulation de l'information (municipales, faux sites, deepfakes, désinformation)."
    }
  }
];
