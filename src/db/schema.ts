import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  boolean,
  json,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  username: text("username").unique(),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  bio: text("bio"),
  isDisabled: boolean("isDisabled").default(false).notNull(),
  role: text("role").$type<"USER" | "ADMIN">().default("USER").notNull(),
  permissions: json("permissions").$type<{
    canSeeStats: boolean;
    canManageBlogs: boolean;
    canManageComments: boolean;
    canManagePages: boolean;
    canManageUsers: boolean;
  }>().default({
    canSeeStats: false,
    canManageBlogs: true,
    canManageComments: true,
    canManagePages: false,
    canManageUsers: false
  }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ]
)

export const blogs = pgTable("blog", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("coverImage"),
  authorId: text("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  isPublished: boolean("isPublished").default(false).notNull(),
  /** Moderation hide: content stays in DB but is not shown publicly. */
  isHidden: boolean("isHidden").default(false).notNull(),
  tags: text("tags").array().default([]),
  metaTitle: text("metaTitle"),
  metaDescription: text("metaDescription"),
  keywords: text("keywords").array().default([]),
  commentsCount: integer("commentsCount").default(0).notNull(),
  /** Page views; updated outside `unstable_cache` blog payload so post body stays cacheable. */
  viewCount: integer("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const comments = pgTable("comment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull(),
  blogId: text("blogId").notNull().references(() => blogs.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  // References self via id for replies
  parentId: text("parentId"),
  isApproved: boolean("isApproved").default(true).notNull(),
  isEdited: boolean("isEdited").default(false).notNull(),
  isDeleted: boolean("isDeleted").default(false).notNull(),
  /** Moderation hide: preserves thread structure without deleting. */
  isHidden: boolean("isHidden").default(false).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const articleVotes = pgTable(
  "article_vote",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    blogId: text("blogId")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** +1 for upvote, -1 for downvote */
    value: integer("value").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => ({
    blogUserUnique: uniqueIndex("article_vote_blog_user_unique").on(
      t.blogId,
      t.userId,
    ),
  }),
);

export const commentVotes = pgTable(
  "comment_vote",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    commentId: text("commentId")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** +1 for upvote, -1 for downvote */
    value: integer("value").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => ({
    commentUserUnique: uniqueIndex("comment_vote_comment_user_unique").on(
      t.commentId,
      t.userId,
    ),
  }),
);

export const articleReports = pgTable(
  "article_report",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    blogId: text("blogId")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    reporterUserId: text("reporterUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull().default("other"),
    details: text("details"),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => ({
    blogReporterUnique: uniqueIndex("article_report_blog_reporter_unique").on(
      t.blogId,
      t.reporterUserId,
    ),
  }),
);

export const commentReports = pgTable(
  "comment_report",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    commentId: text("commentId")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    reporterUserId: text("reporterUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull().default("other"),
    details: text("details"),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => ({
    commentReporterUnique: uniqueIndex(
      "comment_report_comment_reporter_unique",
    ).on(t.commentId, t.reporterUserId),
  }),
);

export const pages = pgTable("page", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const notifications = pgTable("notification", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  message: text("message").notNull(),
  link: text("link").notNull(),
  blogLink: text("blogLink").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  type: text("type")
    .$type<
      | "COMMENT"
      | "SYSTEM"
      | "BLOG_PUBLISHED"
      | "BLOG_UNPUBLISHED"
      | "BLOG_UPDATE"
      | "BLOG_DELETE"
      | "NEWSLETTER_SUBSCRIBE"
      | "USER_SIGNUP"
      | "CONTACT_FORM"
    >()
    .default("COMMENT")
    .notNull(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetAuthorId: text("targetAuthorId").references(() => users.id),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().$onUpdate(() => new Date()).notNull(),
})

/** Public newsletter signups; email is normalized to lowercase in app code. */
export const newsletterSubscribers = pgTable("newsletter_subscriber", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
})

/** Public contact form messages; admins are notified on insert. */
export const contactSubmissions = pgTable("contact_submission", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  /** Workflow: new → read → contacted → resolved */
  status: text("status").notNull().default("new"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
})

import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Blog = InferSelectModel<typeof blogs>;
export type NewBlog = InferInsertModel<typeof blogs>;
export type BlogWithAuthor = Blog & {
  authorId: InferSelectModel<typeof users>;
};

export type Comment = InferSelectModel<typeof comments>;
export type NewComment = InferInsertModel<typeof comments>;

export type Page = InferSelectModel<typeof pages>;
export type NewPage = InferInsertModel<typeof pages>;

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;

export type NewsletterSubscriber = InferSelectModel<typeof newsletterSubscribers>;
export type NewNewsletterSubscriber = InferInsertModel<typeof newsletterSubscribers>;

export type ContactSubmission = InferSelectModel<typeof contactSubmissions>;
export type NewContactSubmission = InferInsertModel<typeof contactSubmissions>;

