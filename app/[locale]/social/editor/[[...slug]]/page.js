import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/utils/roles";
import { setRequestLocale } from "next-intl/server";
import PostForm from "@/components/social/PostForm";

export default async function PostEditorPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/log-in`);

  let initialPost = null;
  if (slug?.[0]) {
    const post = await prisma.post.findUnique({
      where: { slug: slug[0] },
      include: { attachments: true },
    });
    if (!post) redirect(`/${locale}/social`);

    const isOwner = post.authorId === user.id;
    const isModerator = user.role === "Admin" || user.role === "Moderator";
    if (!isOwner && !isModerator) redirect(`/${locale}/social`);

    initialPost = {
      id: post.id,
      title: post.title,
      flair: post.flair,
      contentJson: post.contentJson,
      attachments: post.attachments.map((a) => ({
        url: a.url,
        fileName: a.fileName,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
      })),
    };
  }

  return <PostForm initialPost={initialPost} />;
}
