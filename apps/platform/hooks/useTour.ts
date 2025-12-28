'use client';

import { useEffect, useRef } from 'react';
import { driver, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export type TourStep = {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: string;
    align?: string;
  };
};

export const useTour = () => {
  const driverObj = useRef<Driver | null>(null);

  useEffect(() => {
    driverObj.current = driver({
      animate: true,
      showProgress: true,
      allowClose: true,
      doneBtnText: '¡Listo!',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      popoverClass: 'driver-popover-kura-dark', // Custom class for styling
      steps: [
        {
          element: '[data-tour="sidebar-patients"]',
          popover: {
            title: 'Pacientes',
            description: 'Aquí comienza todo. Ve a la sección de Pacientes para gestionar tus expedientes.',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '[data-tour="btn-new-patient"]',
          popover: {
            title: 'Nuevo Expediente',
            description: 'Haz clic aquí para crear tu primer paciente.',
            side: 'bottom',
            align: 'end'
          }
        },
        {
          element: '[data-tour="input-name"]',
          popover: {
            title: 'El Nombre es la Llave',
            description: 'Escribe el nombre del paciente. Es el único dato obligatorio para empezar.',
            side: 'bottom',
            align: 'start'
          }
        }
      ],
      onDestroyed: () => {
        // Optional cleanup
      }
    });

    // Inject custom styles for Dark Mode Theme matching Kura OS
    const styleId = 'driver-kura-theme';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .driver-popover-kura-dark {
                background-color: #1e293b !important; /* Slate 800 */
                color: #f8fafc !important; /* Slate 50 */
                border: 1px solid #334155 !important; /* Slate 700 */
                border-radius: 12px !important;
                box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
                font-family: var(--font-body) !important;
            }
            .driver-popover-kura-dark .driver-popover-title {
                font-family: var(--font-display) !important;
                font-weight: 700 !important;
                font-size: 1.1rem !important;
            }
            .driver-popover-kura-dark .driver-popover-description {
                color: #cbd5e1 !important; /* Slate 300 */
                line-height: 1.5 !important;
            }
            .driver-popover-kura-dark .driver-popover-footer button {
                border-radius: 6px !important;
                font-weight: 600 !important;
                padding: 6px 12px !important;
            }
            .driver-popover-kura-dark .driver-popover-next-btn {
                background-color: #10b981 !important; /* Emerald 500 */
                color: #020617 !important; /* Slate 950 */
                border: none !important;
                text-shadow: none !important;
            }
            .driver-popover-kura-dark .driver-popover-next-btn:hover {
                background-color: #059669 !important; /* Emerald 600 */
            }
            .driver-popover-kura-dark .driver-popover-prev-btn {
                background-color: transparent !important;
                color: #94a3b8 !important; /* Slate 400 */
                border: 1px solid #334155 !important;
            }
            .driver-popover-kura-dark .driver-popover-prev-btn:hover {
                background-color: #334155 !important; /* Slate 700 */
                color: #f8fafc !important;
            }
            .driver-popover-kura-dark .driver-popover-close-btn {
                color: #64748b !important;
            }
            .driver-popover-kura-dark .driver-popover-close-btn:hover {
                color: #f8fafc !important;
            }
        `;
        document.head.appendChild(style);
    }

  }, []);

  const startTour = () => {
    if (driverObj.current) {
      driverObj.current.drive();
    }
  };

  return { startTour };
};
