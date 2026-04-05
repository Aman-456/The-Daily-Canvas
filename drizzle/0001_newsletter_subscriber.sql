CREATE TABLE "newsletter_subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscriber_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "blog" ALTER COLUMN "tags" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "blog" ALTER COLUMN "keywords" SET DEFAULT '{}';