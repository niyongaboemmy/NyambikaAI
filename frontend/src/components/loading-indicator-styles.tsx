'use client';

export function LoadingIndicatorStyles() {
  return (
    <style jsx global>{`
      /* Navigation loading indicator using class-based approach */
      html.navigation-loading::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #2563eb, #7c3aed);
        transform: scaleX(0);
        transform-origin: left;
        z-index: 1000;
        animation: loading 1.5s infinite;
        opacity: 1;
      }

      /* Fallback for data attribute approach */
      [data-navigation-loading="true"]::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #2563eb, #7c3aed);
        transform: scaleX(0);
        transform-origin: left;
        z-index: 1000;
        animation: loading 1.5s infinite;
        opacity: 1;
      }

      @keyframes loading {
        0% {
          transform: scaleX(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        100% {
          transform: scaleX(1);
          opacity: 0;
        }
      }
    `}</style>
  );
}
