

export const config = {
  'terminal': {
    type: 'object',
    oder: 1,
    title: 'Terminal Colors',
    properties: {
      'selectionAlpha': {
        order: -1,
        type: 'number',
        title: 'Selection Opacity',
        default: 0.3,
        minimum: 0,
        maximum: 1
      },
      'ansiBlack': {
        order: 0,
        type: 'object',
        title: 'Black',
        properties: {
          light: {
            default: '#000000',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#000000',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiRed': {
        order: 1,
        type: 'object',
        title: 'Red',
        properties: {
          light: {
            default: '#cd3131',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#cd3131',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiGreen': {
        order: 2,
        type: 'object',
        title: 'Green',
        properties: {
          light: {
            default: '#00BC00',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#0DBC79',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiYellow': {
        order: 3,
        type: 'object',
        title: 'Yellow',
        properties: {
          light: {
            default: '#949800',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#e5e510',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiBlue': {
        order: 4,
        type: 'object',
        title: 'Blue',
        properties: {
          light: {
            default: '#0451a5',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#2472c8',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiMagenta': {
        order: 5,
        type: 'object',
        title: 'Magenta',
        properties: {
          light: {
            default: '#bc05bc',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#bc3fbc',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiCyan': {
        order: 6,
        type: 'object',
        title: 'Cyan',
        properties: {
          light: {
            default: '#0598bc',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#11a8cd',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiWhite': {
        order: 7,
        type: 'object',
        title: 'White',
        properties: {
          light: {
            default: '#555555',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#e5e5e5',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiBrightBlack': {
        order: 8,
        type: 'object',
        title: 'Bright Black',
        properties: {
          light: {
            default: '#666666',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#666666',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiBrightRed': {
        order: 9,
        type: 'object',
        title: 'Bright Red',
        properties: {
          light: {
            default: '#cd3131',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#f14c4c',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiBrightGreen': {
        order: 10,
        type: 'object',
        title: 'Bright Green',
        properties: {
          light: {
            default: '#14CE14',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#19bc3a',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiBrightYellow': {
        order: 11,
        type: 'object',
        title: 'Bright Yellow',
        properties: {
          light: {
            default: '#b5ba00',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#f5f543',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiBrightBlue': {
        order: 12,
        type: 'object',
        title: 'Bright Blue',
        properties: {
          light: {
            default: '#0451a5',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#3b8eea',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiBrightMagenta': {
        order: 13,
        type: 'object',
        title: 'Bright Magenta',
        properties: {
          light: {
            default: '#bc05bc',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#d670d6',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiBrightCyan': {
        order: 14,
        type: 'object',
        title: 'Bright Cyan',
        properties: {
          light: {
            default: '#0598bc',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#29b8db',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      },
      'ansiBrightWhite': {
        order: 15,
        type: 'object',
        title: 'Bright White',
        properties: {
          light: {
            default: '#a5a5a5',
            title: 'for light backgrounds',
            type: 'color',
          },
          dark: {
            default: '#e5e5e5',
            title: 'for dark backgrounds',
            type: 'color'
          }
        }
      }
    }
  }
}
