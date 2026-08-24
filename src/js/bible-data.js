/**
 * ProPresenter AI Studio - Bible Canon & Verses Database
 */

export const BIBLE_VERSIONS = [];

export const BIBLE_BOOKS = [
  // Antiguo Testamento (39 Libros)
  { id: "GEN", name: "Génesis", testament: "OT", chapters: 50 },
  { id: "EXO", name: "Éxodo", testament: "OT", chapters: 40 },
  { id: "LEV", name: "Levítico", testament: "OT", chapters: 27 },
  { id: "NUM", name: "Números", testament: "OT", chapters: 36 },
  { id: "DEU", name: "Deuteronomio", testament: "OT", chapters: 34 },
  { id: "JOS", name: "Josué", testament: "OT", chapters: 24 },
  { id: "JDG", name: "Jueces", testament: "OT", chapters: 21 },
  { id: "RUT", name: "Rut", testament: "OT", chapters: 4 },
  { id: "1SA", name: "1 Samuel", testament: "OT", chapters: 31 },
  { id: "2SA", name: "2 Samuel", testament: "OT", chapters: 24 },
  { id: "1KI", name: "1 Reyes", testament: "OT", chapters: 22 },
  { id: "2KI", name: "2 Reyes", testament: "OT", chapters: 25 },
  { id: "1CH", name: "1 Crónicas", testament: "OT", chapters: 29 },
  { id: "2CH", name: "2 Crónicas", testament: "OT", chapters: 36 },
  { id: "EZR", name: "Esdras", testament: "OT", chapters: 10 },
  { id: "NEH", name: "Nehemías", testament: "OT", chapters: 13 },
  { id: "EST", name: "Ester", testament: "OT", chapters: 10 },
  { id: "JOB", name: "Job", testament: "OT", chapters: 42 },
  { id: "PSA", name: "Salmos", testament: "OT", chapters: 150 },
  { id: "PRO", name: "Proverbios", testament: "OT", chapters: 31 },
  { id: "ECC", name: "Eclesiastés", testament: "OT", chapters: 12 },
  { id: "SNG", name: "Cantares", testament: "OT", chapters: 8 },
  { id: "ISA", name: "Isaías", testament: "OT", chapters: 66 },
  { id: "JER", name: "Jeremías", testament: "OT", chapters: 52 },
  { id: "LAM", name: "Lamentaciones", testament: "OT", chapters: 5 },
  { id: "EZK", name: "Ezequiel", testament: "OT", chapters: 48 },
  { id: "DAN", name: "Daniel", testament: "OT", chapters: 12 },
  { id: "HOS", name: "Oseas", testament: "OT", chapters: 14 },
  { id: "JOL", name: "Joel", testament: "OT", chapters: 3 },
  { id: "AMO", name: "Amós", testament: "OT", chapters: 9 },
  { id: "OBA", name: "Abdías", testament: "OT", chapters: 1 },
  { id: "JON", name: "Jonás", testament: "OT", chapters: 4 },
  { id: "MIC", name: "Miqueas", testament: "OT", chapters: 7 },
  { id: "NAM", name: "Nahúm", testament: "OT", chapters: 3 },
  { id: "HAB", name: "Habacuc", testament: "OT", chapters: 3 },
  { id: "ZEP", name: "Sofonías", testament: "OT", chapters: 3 },
  { id: "HAG", name: "Hageo", testament: "OT", chapters: 2 },
  { id: "ZEC", name: "Zacarías", testament: "OT", chapters: 14 },
  { id: "MAL", name: "Malaquías", testament: "OT", chapters: 4 },

  // Nuevo Testamento (27 Libros)
  { id: "MAT", name: "Mateo", testament: "NT", chapters: 28 },
  { id: "MRK", name: "Marcos", testament: "NT", chapters: 16 },
  { id: "LUK", name: "Lucas", testament: "NT", chapters: 24 },
  { id: "JHN", name: "Juan", testament: "NT", chapters: 21 },
  { id: "ACT", name: "Hechos", testament: "NT", chapters: 28 },
  { id: "ROM", name: "Romanos", testament: "NT", chapters: 16 },
  { id: "1CO", name: "1 Corintios", testament: "NT", chapters: 16 },
  { id: "2CO", name: "2 Corintios", testament: "NT", chapters: 13 },
  { id: "GAL", name: "Gálatas", testament: "NT", chapters: 6 },
  { id: "EPH", name: "Efesios", testament: "NT", chapters: 6 },
  { id: "PHP", name: "Filipenses", testament: "NT", chapters: 4 },
  { id: "COL", name: "Colosenses", testament: "NT", chapters: 4 },
  { id: "1TH", name: "1 Tesalonicenses", testament: "NT", chapters: 5 },
  { id: "2TH", name: "2 Tesalonicenses", testament: "NT", chapters: 3 },
  { id: "1TI", name: "1 Timoteo", testament: "NT", chapters: 6 },
  { id: "2TI", name: "2 Timoteo", testament: "NT", chapters: 4 },
  { id: "TIT", name: "Tito", testament: "NT", chapters: 3 },
  { id: "PHM", name: "Filemón", testament: "NT", chapters: 1 },
  { id: "HEB", name: "Hebreos", testament: "NT", chapters: 13 },
  { id: "JAS", name: "Santiago", testament: "NT", chapters: 5 },
  { id: "1PE", name: "1 Pedro", testament: "NT", chapters: 5 },
  { id: "2PE", name: "2 Pedro", testament: "NT", chapters: 3 },
  { id: "1JN", name: "1 Juan", testament: "NT", chapters: 5 },
  { id: "2JN", name: "2 Juan", testament: "NT", chapters: 1 },
  { id: "3JN", name: "3 Juan", testament: "NT", chapters: 1 },
  { id: "JUD", name: "Judas", testament: "NT", chapters: 1 },
  { id: "REV", name: "Apocalipsis", testament: "NT", chapters: 22 }
];

// Rich Passages Database (RVR1960 / NVI)
const POPULAR_PASSAGES = {
  "GEN-1": [
    "En el principio creó Dios los cielos y la tierra.",
    "Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas.",
    "Y dijo Dios: Sea la luz; y fue la luz.",
    "Y vio Dios que la luz era buena; y separó Dios la luz de las tinieblas.",
    "Y llamó Dios a la luz Día, y a las tinieblas llamó Noche. Y fue la tarde y la mañana un día.",
    "Luego dijo Dios: Haya expansión en medio de las aguas, y separe las aguas de las aguas.",
    "E hizo Dios la expansión, y separó las aguas que estaban debajo de la expansión, de las aguas que estaban sobre la expansión. Y fue así.",
    "Y llamó Dios a la expansión Cielos. Y fue la tarde y la mañana el día segundo.",
    "Dijo también Dios: Júntense las aguas que están debajo de los cielos en un lugar, y descúbrase lo seco. Y fue así.",
    "Y llamó Dios a lo seco Tierra, y a la reunión de las aguas llamó Mares. Y vio Dios que era bueno."
  ],
  "PSA-23": [
    "Jehová es mi pastor; nada me faltará.",
    "En lugares de delicados pastos me hará descansar; Junto a aguas de reposo me pastoreará.",
    "Confortará mi alma; Me guiará por sendas de justicia por amor de su nombre.",
    "Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo; Tu vara y tu cayado me infundirán aliento.",
    "Aderezas mesa delante de mí en presencia de mis angustiadores; Unges mi cabeza con aceite; mi copa está rebosando.",
    "Ciertamente el bien y la misericordia me seguirán todos los días de mi vida, Y en la casa de Jehová moraré por largos días."
  ],
  "JHN-3": [
    "Había un hombre de los fariseos que se llamaba Nicodemo, un principal entre los judíos.",
    "Este vino a Jesús de noche, y le dijo: Rabí, sabemos que has venido de Dios como maestro; porque nadie puede hacer estas señales que tú haces, si no está Dios con él.",
    "Respondió Jesús y le dijo: De cierto, de cierto te digo, que el que no naciere de nuevo, no puede ver el reino de Dios.",
    "Nicodemo le dijo: ¿Cómo puede un hombre nacer siendo viejo? ¿Puede acaso entrar por segunda vez en el vientre de su madre, y nacer?",
    "Respondió Jesús: De cierto, de cierto te digo, que el que no naciere de agua y del Espíritu, no puede entrar en el reino de Dios.",
    "Lo que es nacido de la carne, carne es; y lo que es nacido del Espíritu, espíritu es.",
    "No te me maravilles de que te dije: Os es necesario nacer de nuevo.",
    "El viento sopla de donde quiere, y oyes su sonido; mas ni sabes de dónde viene, ni a dónde va; así es todo aquel que es nacido del Espíritu.",
    "Respondió Nicodemo y le dijo: ¿Cómo puede hacerse esto?",
    "Respondió Jesús y le dijo: ¿Eres tú maestro de Israel, y no sabes esto?",
    "De cierto, de cierto te digo, que lo que sabemos hablamos, y lo que hemos visto, testificamos; y no recibís nuestro testimonio.",
    "Si os he dicho cosas terrenales, y no creéis, ¿cómo creeréis si os dijere las celestiales?",
    "Nadie subió al cielo, sino el que descendió del cielo; el Hijo del Hombre, que está en el cielo.",
    "Y como Moisés levantó la serpiente en el desierto, así es necesario que el Hijo del Hombre sea levantado,",
    "Para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
    "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
    "Porque no envió Dios a su Hijo al mundo para condenar al mundo, sino para que el mundo sea salvo por él.",
    "El que en él cree, no es condenado; pero el que no cree, ya ha sido condenado, porque no ha creído en el nombre del unigénito Hijo de Dios."
  ],
  "PHP-4": [
    "Así que, hermanos míos amados y deseados, gozo y corona mía, estad así firmes en el Señor, amados.",
    "Ruego a Evodia y a Síntique, que sean de un mismo sentir en el Señor.",
    "Asimismo te ruego también a ti, compañero fiel, que ayudes a éstas que combatieron juntamente conmigo en el evangelio, con Clemente también y los demás mis colaboradores, cuyos nombres están en el libro de la vida.",
    "Regocijaos en el Señor siempre. Otra vez digo: ¡Regocijaos!",
    "Vuestra gentileza sea conocida de todos los hombres. El Señor está cerca.",
    "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.",
    "Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.",
    "Por lo demás, hermanos, todo lo que es verdadero, todo lo honesto, todo lo justo, todo lo puro, todo lo amable, todo lo que es de buen nombre; si hay virtud alguna, si algo digno de alabanza, en esto pensad.",
    "Lo que aprendisteis y recibisteis y oísteis y visteis en mí, esto haced; y el Dios de paz estará con vosotros.",
    "En gran manera me gocé en el Señor de que ya al fin habéis florecido vuestro cuidado de mí; de lo cual también estabais solícitos, pero os faltaba la oportunidad.",
    "No lo digo porque tenga escasez, pues he aprendido a contentarme, cualquiera que sea mi situación.",
    "Sé vivir humildemente, y sé tener abundancia; en todo y por todo estoy enseñado, así para estar saciado como para tener hambre, así para tener abundancia como para padecer necesidad.",
    "Todo lo puedo en Cristo que me fortalece."
  ],
  "ROM-8": [
    "Ahora, pues, ninguna condenación hay para los que están en Cristo Jesús, los que no andan conforme a la carne, sino conforme al Espíritu.",
    "Porque la ley del Espíritu de vida en Cristo Jesús me ha librado de la ley del pecado y de la muerte.",
    "Porque lo que era imposible para la ley, por cuanto era débil por la carne, Dios, enviando a su Hijo en semejanza de carne de pecado y a causa del pecado, condenó al pecado en la carne;",
    "Para que la justicia de la ley se cumpliese en nosotros, que no andamos conforme a la carne, sino conforme al Espíritu.",
    "Porque los que son de la carne piensan en las cosas de la carne; pero los que son del Espíritu, en las cosas del Espíritu.",
    "Porque el ocuparse de la carne es muerte, pero el ocuparse del Espíritu es vida y paz.",
    "Por cuanto los designios de la carne son enemistad contra Dios; porque no se sujetan a la ley de Dios, ni tampoco pueden;",
    "Y los que viven según la carne no pueden agradar a Dios.",
    "Mas vosotros no vivís según la carne, sino según el Espíritu, si es que el Espíritu de Dios mora en vosotros.",
    "Y si Cristo está en vosotros, el cuerpo en verdad está muerto a causa del pecado, mas el espíritu vive a causa de la justicia.",
    "Y si el Espíritu de aquel que levantó de los muertos a Jesús mora en vosotros, el que levantó de los muertos a Cristo Jesús vivificará también vuestros cuerpos mortales por su Espíritu que mora en vosotros.",
    "Así que, hermanos, deudores somos, no a la carne, para que vivamos conforme a la carne;",
    "Porque si vivís conforme a la carne, moriréis; mas si por el Espíritu hacéis morir las obras de la carne, viviréis.",
    "Porque todos los que son guiados por el Espíritu de Dios, éstos son hijos de Dios.",
    "Pues no habéis recibido el espíritu de esclavitud para estar otra vez en temor, sino que habéis recibido el espíritu de adopción, por el cual clamamos: ¡Abba, Padre!",
    "El Espíritu mismo da testimonio a nuestro espíritu, de que somos hijos de Dios.",
    "Y si hijos, también herederos; herederos de Dios y coherederos con Cristo, si es que padecemos juntamente con él, para que juntamente con él seamos glorificados.",
    "Pues tengo por cierto que las aflicciones del tiempo presente no son comparables con la gloria venidera que en nosotros ha de manifestarse.",
    "Porque el anhelo ardiente de la creación es el aguardar la manifestación de los hijos de Dios.",
    "Porque la creación fue sujetada a vanidad, no por su propia voluntad, sino por causa del que la sujetó en esperanza;",
    "Porque también la creación misma será librada de la esclavitud de corrupción, a la libertad gloriosa de los hijos de Dios.",
    "Porque sabemos que toda la creación gime a una, y a una está con dolores de parto hasta ahora;",
    "Y no sólo ella, sino que también nosotros mismos, que tenemos las primicias del Espíritu, nosotros también gemimos dentro de nosotros mismos, esperando la adopción, la redención de nuestro cuerpo.",
    "Porque en esperanza fuimos salvos; pero la esperanza que se ve, no es esperanza; porque lo que alguno ve, ¿a qué esperarlo?",
    "Pero si esperamos lo que no vemos, con paciencia lo aguardamos.",
    "Y de igual manera el Espíritu nos ayuda en nuestra debilidad; pues qué hemos de pedir como conviene, no lo sabemos, pero el Espíritu mismo intercede por nosotros con gemidos indecibles.",
    "Mas el que escudriña los corazones sabe cuál es la intención del Espíritu, porque conforme a la voluntad de Dios intercede por los santos.",
    "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados."
  ]
};

export const CUSTOM_BIBLES = {};

// Cargar biblias personalizadas guardadas en localStorage
try {
  const saved = localStorage.getItem("propresenter_custom_bibles");
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.assign(CUSTOM_BIBLES, parsed);
  }
} catch (e) {
  console.error("No se pudieron cargar las biblias guardadas:", e);
}

export function getAllBibleVersions() {
  const customList = Object.keys(CUSTOM_BIBLES).map(id => ({
    id: id,
    name: CUSTOM_BIBLES[id].name,
    tag: CUSTOM_BIBLES[id].tag || "JSON",
    isCustom: true
  }));
  return [...BIBLE_VERSIONS.map(v => ({ ...v, isCustom: false })), ...customList];
}

export function deleteCustomBible(versionId) {
  if (CUSTOM_BIBLES[versionId]) {
    delete CUSTOM_BIBLES[versionId];
    try {
      localStorage.setItem("propresenter_custom_bibles", JSON.stringify(CUSTOM_BIBLES));
    } catch (e) {
      console.error("Error al actualizar biblias en localStorage:", e);
    }
    return true;
  }
  return false;
}

export function parseAndAddCustomBible(jsonData, sourceUrl = '') {
  if (!jsonData || !jsonData.books || !Array.isArray(jsonData.books)) {
    throw new Error("El archivo JSON no tiene la estructura de libros bíblicos requerida.");
  }

  const versionId = jsonData.local_abbreviation || `CUSTOM-${Date.now()}`;
  const versionName = jsonData.local_title || jsonData.name || `Biblia (${versionId})`;
  const tag = (jsonData.language && (jsonData.language.iso_639_1 || jsonData.language.iso_639_3) ? (jsonData.language.iso_639_1 || jsonData.language.iso_639_3) : "JSON").toUpperCase();

  const parsedBooks = {};

  jsonData.books.forEach(b => {
    const usfm = (b.book_usfm || b.usfm || b.name || "").toUpperCase();
    if (!usfm) return;

    parsedBooks[usfm] = {
      name: b.name,
      chapters: {}
    };

    if (b.chapters && Array.isArray(b.chapters)) {
      b.chapters.forEach((c, cIdx) => {
        const chapNum = cIdx + 1;
        const verseList = [];

        if (c.items && Array.isArray(c.items)) {
          c.items.forEach(item => {
            if (item.type === 'verse' && item.lines && item.lines.length > 0) {
              const vNum = (item.verse_numbers && item.verse_numbers.length > 0) ? item.verse_numbers[0] : (verseList.length + 1);
              const vText = item.lines.join(' ').trim();
              if (vText) {
                verseList.push({
                  number: vNum,
                  text: vText
                });
              }
            }
          });
        }

        parsedBooks[usfm].chapters[chapNum] = verseList;
      });
    }
  });

  const customBibleObj = {
    id: versionId,
    name: versionName,
    tag: tag,
    sourceUrl: sourceUrl,
    books: parsedBooks
  };

  CUSTOM_BIBLES[versionId] = customBibleObj;

  try {
    localStorage.setItem("propresenter_custom_bibles", JSON.stringify(CUSTOM_BIBLES));
  } catch (e) {
    console.error("Límite de almacenamiento alcanzado al guardar biblia personalizada:", e);
  }

  return customBibleObj;
}

export async function fetchAndLoadBibleFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}: No se pudo descargar la Biblia desde la URL especificada.`);
  }
  const jsonData = await response.json();
  return parseAndAddCustomBible(jsonData, url);
}

// Retrieve Verses for any Book & Chapter & Version
export function getChapterVerses(bookId, chapterNum, bibleVersionId = '') {
  if (CUSTOM_BIBLES[bibleVersionId]) {
    const custom = CUSTOM_BIBLES[bibleVersionId];
    if (custom.books) {
      const bObj = custom.books[bookId] || Object.values(custom.books).find(b => b.name.toLowerCase() === (bookId || '').toLowerCase());
      if (bObj && bObj.chapters && bObj.chapters[chapterNum]) {
        const verses = bObj.chapters[chapterNum];
        if (verses && verses.length > 0) return verses;
      }
    }
  }

  // Si no se especifica versión o se eliminó, usar la primera Biblia cargada
  const allLoadedKeys = Object.keys(CUSTOM_BIBLES);
  if (allLoadedKeys.length > 0) {
    const firstCustom = CUSTOM_BIBLES[allLoadedKeys[0]];
    if (firstCustom && firstCustom.books && firstCustom.books[bookId] && firstCustom.books[bookId].chapters[chapterNum]) {
      return firstCustom.books[bookId].chapters[chapterNum];
    }
  }

  return [];
}

export function splitVerseText(verseText, maxLines = 2) {
  if (!verseText) return [""];
  if (maxLines <= 0) return [verseText];

  const rawLines = verseText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const formattedLines = [];

  for (const line of rawLines) {
    if (line.length > 60) {
      const parts = line.split(/(?<=[;,\.\?!])\s+/);
      let currentChunk = "";
      for (const part of parts) {
        if ((currentChunk + " " + part).trim().length > 55) {
          if (currentChunk) formattedLines.push(currentChunk.trim());
          currentChunk = part;
        } else {
          currentChunk = (currentChunk + " " + part).trim();
        }
      }
      if (currentChunk) formattedLines.push(currentChunk.trim());
    } else {
      formattedLines.push(line);
    }
  }

  const slideTexts = [];
  for (let i = 0; i < formattedLines.length; i += maxLines) {
    const chunk = formattedLines.slice(i, i + maxLines).join('\n');
    slideTexts.push(chunk);
  }

  return slideTexts.length > 0 ? slideTexts : [verseText];
}
