import { icons, createIcons } from 'lucide';

/**
 * Convierte un nombre en kebab-case a PascalCase (ej: 'volume-2' -> 'Volume2', 'trash-2' -> 'Trash2')
 */
export function toPascalCase(str) {
  if (!str) return '';
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Devuelve el código HTML del SVG para el icono solicitado de Lucide.
 * @param {string} name Nombre del icono (en kebab-case o PascalCase, ej: 'search', 'music', 'folder')
 * @param {Object} options Opciones de personalización
 * @param {number} [options.size=16] Tamaño en píxeles (width y height)
 * @param {number} [options.strokeWidth=2] Grosor del trazo
 * @param {string} [options.className='lucide-icon'] Clases CSS adicionales
 * @param {string} [options.color='currentColor'] Color de trazo (admite currentColor o variables CSS)
 * @param {string} [options.style=''] Estilo inline adicional
 * @returns {string} Markup HTML del SVG
 */
export function iconSvg(name, {
  size = 14,
  strokeWidth = 2,
  className = 'lucide-icon',
  color = 'currentColor',
  style = ''
} = {}) {
  if (!name) return '';
  const pascal = toPascalCase(name);
  const iconNode = icons[pascal] || icons[name];
  if (!iconNode) {
    return '';
  }

  const innerSvg = iconNode.map(([tag, attrs]) => {
    const attrEntries = Object.entries(attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    return `<${tag} ${attrEntries}></${tag}>`;
  }).join('');

  const classAttr = className ? ` class="${className}"` : '';
  const styleAttr = style ? ` style="${style}"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${classAttr}${styleAttr}>${innerSvg}</svg>`;
}

/**
 * Mapeo oficial de iconos temáticos por sección de canciones (Intro, Coro, Verso, etc.)
 */
export const SECTION_ICONS = {
  intro: 'music',
  verse: 'book-open',
  prechorus: 'zap',
  chorus: 'flame',
  bridge: 'git-commit',
  instrumental: 'headphones',
  outro: 'flag',
  sermon: 'message-square',
  lowerthird: 'user'
};

/**
 * Devuelve el SVG correspondiente a una sección según su ID o clase de badge.
 */
export function getSectionIconSvg(sectionKey, options = {}) {
  const key = (sectionKey || '').toLowerCase();
  let iconName = 'book-open';

  if (key.includes('intro')) iconName = 'music';
  else if (key.includes('prechorus') || key.includes('pre-coro')) iconName = 'zap';
  else if (key.includes('chorus') || key.includes('coro')) iconName = 'flame';
  else if (key.includes('bridge') || key.includes('puente')) iconName = 'git-commit';
  else if (key.includes('instrumental') || key.includes('solo')) iconName = 'headphones';
  else if (key.includes('outro') || key.includes('final')) iconName = 'flag';
  else if (key.includes('sermon') || key.includes('sermón')) iconName = 'message-square';
  else if (key.includes('lowerthird') || key.includes('overlay')) iconName = 'user';

  return iconSvg(iconName, { size: 14, ...options });
}

/**
 * Mapeo de iconos para categorías de biblioteca.
 */
export const CATEGORY_ICONS = {
  'Alabanza': 'music',
  'Adoración': 'heart',
  'Sermón': 'mic',
  'Sermones': 'mic',
  'Lectura': 'book-open',
  'Escrituras / Lectura': 'book-open',
  'Anuncio': 'megaphone',
  'Anuncios / Avisos': 'megaphone',
  'Anuncios': 'megaphone',
  'Overlays Stream': 'user',
  'Presentación': 'presentation',
  'Predicación': 'book-open',
  'Enseñanza': 'graduation-cap'
};

/**
 * Devuelve el SVG para una categoría de canciones / shows.
 */
export function getCategoryIconSvg(catName, options = {}) {
  const iconName = CATEGORY_ICONS[catName] || 'file-text';
  return iconSvg(iconName, { size: 14, ...options });
}

/**
 * Escanea el DOM y reemplaza todos los elementos con atributo [data-lucide]
 * por sus respectivos SVGs de Lucide.
 * @param {HTMLElement|Document} [root=document] Elemento raíz donde buscar
 */
export function initIcons(root = document) {
  if (typeof document === 'undefined') return;
  try {
    createIcons({
      icons,
      nameAttr: 'data-lucide',
      attrs: {
        width: 14,
        height: 14,
        'stroke-width': 2,
        class: 'lucide-icon'
      },
      root
    });
  } catch (err) {
    console.warn('[Lucide] Error inicializando iconos:', err);
  }
}

