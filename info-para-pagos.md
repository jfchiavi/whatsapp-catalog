## tabla tentant

-- public."Tenant" definition

-- Drop table

-- DROP TABLE public."Tenant";

CREATE TABLE public."Tenant" (
	id text NOT NULL,
	"name" text NOT NULL,
	slug text NOT NULL,
	"domain" text NULL,
	"logoUrl" text NULL,
	"primaryColor" text DEFAULT '#000000'::text NULL,
	description text NULL,
	"whatsappNumber" text NULL,
	active bool DEFAULT true NOT NULL,
	CONSTRAINT "Tenant_pkey" PRIMARY KEY (id)
);
CREATE UNIQUE INDEX "Tenant_domain_key" ON public."Tenant" USING btree (domain);
CREATE UNIQUE INDEX "Tenant_slug_key" ON public."Tenant" USING btree (slug);

## tabla Order

-- public."Order" definition

-- Drop table

-- DROP TABLE public."Order";

CREATE TABLE public."Order" (
	id text NOT NULL,
	"tenantId" text NOT NULL,
	"cartId" text NULL,
	"branchId" text NOT NULL,
	"customerId" text NULL,
	"representativeId" text NULL,
	"customerName" text NOT NULL,
	"customerPhone" text NOT NULL,
	"customerNotes" text NULL,
	status text DEFAULT 'pending'::text NOT NULL,
	"totalSnapshot" float8 NOT NULL,
	"whatsappMessage" text NOT NULL,
	"whatsappUrl" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	CONSTRAINT "Order_pkey" PRIMARY KEY (id)
);


-- public."Order" foreign keys

ALTER TABLE public."Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE public."Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE public."Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

