## ejecutar el script en la db

```bash
docker exec -i <nombre_contenedor_postgres> psql -U <usuario> -d <db> < seed-athelnova.sql
```

Se ha procesado todo el material del catálogo y se ha generado el script SQL completo en 

seed-athelnova.sql
 junto con todos los assets visuales.

1. Tenant y Sucursales de Athelnova
Tenant: Athelnova (slug: athelnova, dominio: athelnova.com, whatsapp: +59174103444, color primario: #2b4bb5, logo: /athelnova/images/web/logo.png).
Sucursales:
Sucursal Central Oruro (Física en Velasco Galvarro entre Caro y Cochabamba, Oruro, Bolivia).
Tienda Online Athelnova (Virtual 24/7).
Usuarios creados:
admin@athelnova.com (SUPER_ADMIN, contraseña por defecto: 123456).
seller@athelnova.com (SELLER, asignado a la sucursal física, contraseña por defecto: 123456).
2. Extracción y Organización de Imágenes
Las imágenes fueron procesadas a alta resolución y vinculadas a cada registro:

Imágenes Web: En 

frontend/public/athelnova/images/web/
logo.png (Logo oficial de Athelnova con tipografía y slogan).
icon.png (Isotipo / isotipo circular degradé azul/púrpura).
hero_banner.jpg (Banner principal de portada).
Imágenes de Productos: En 

frontend/public/athelnova/images/products/
 (54 imágenes recortadas y optimizadas correspondientes a cada modelo, código y textura del catálogo).
3. Productos y Variantes Registrados (54 productos)
Porcelanatos Vitrificados 60x60 cm:
Porcelanato Blanco 60x60 (POR-BLA-60, 160 Bs/m²)
Porcelanato Negro Vitrificado 60x60 (POR-NEG-VIT-60, 160 Bs/m²)
Volcan Dorado (Item #6084, POR-VIT-6084)
Oro Volcánico (Item #6108, POR-VIT-6108)
Venas Doradas (Item #6107, POR-VIT-6107)
Blanco Cosmos (Item #6122, POR-VIT-6122)
Volcan Gris (Item #6109, POR-VIT-6109)
Blanco Plateado (Item #6073, POR-VIT-6073)
Cosmos Oscuro (Item #6125, POR-VIT-6125)
Plomo Bruma (Item #6023, POR-VIT-6023)
Negro Tigre (Item #6996, POR-VIT-6996)
Mármol Oscuro (Item #6994, POR-VIT-6994)
Negro Entero (Item #6999, POR-VIT-6999)
Café Eléctrico (Item #6705, POR-VIT-6705)
Beige Oro Cielo (Item #6243, POR-VIT-6243)
Beige Mármol (Item #6233, POR-VIT-6233)
Plomo Claro Lineal (Item #6044, POR-VIT-6044)
Plomo Imperial (Item #6002, POR-VIT-6002)
Plomo Cobre (Item #6093, POR-VIT-6093)
Pisos Flotantes y Pisos Vinílicos SPC:
Pisos flotantes de 12 mm y 8 mm (Roble Claro, Nogal Clásico, Haya Natural, Cerezo Cálido, Roble Miel).
Pisos Vinílicos SPC 4mm Marca Holzböden (Roble Gris, Roble Natural, Nogal Oscuro).
Cielo Raso y Yeso Desmontable (Placas 0.60 x 0.60 m):
Modelos KN6452-5, KN6115, CF-HOLO-01, MTK000, Yeso Arena, Yeso Relieve Dorado, Yeso Geometría Estilizada, Yeso Curvas, Quatrefoil Estrella, Yeso Beleza, Diamante Quatrefoil (CPS-GYP-DQ01), Baldosa Modular T-Grid (GM6060-E).
Cielo Falso PVC y Perfilería:
Láminas Alveolares y Símil Madera 6m (Blanco con Línea, Ondas Gris Plata, Madera Caoba 3 Ranuras, Roble Claro, Pino Claro, ORI 11, ORI 12, Roble Ceniza, Texturas 3D Ondas y Diamante).
Perfiles perimetrales (Sin sujeción, con sujeción, pecho de paloma y soporte unión H/T).
4. Ejecución del script
El script 

seed-athelnova.sql
 es idempotente (usa ON CONFLICT con UUIDs determinísticos). Puedes ejecutarlo contra tu base de datos de Docker/PostgreSQL cuando gustes: