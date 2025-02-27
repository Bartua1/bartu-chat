import { SignedIn } from "@clerk/nextjs";
import Link from "next/link";
import { db } from "~/server/db";
import { SignedOut } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

const mockUrls = [
  "https://3pooft8s3y.ufs.sh/f/D1wyDGzKuE9V7OiAkFMPgCapiVuEbOJmjlNIGc3KyQdWMsv1",
  "https://3pooft8s3y.ufs.sh/f/D1wyDGzKuE9VmT9Wz50DFL8cS2oM1rYgBfajxJZelKyNvzEG",
  "https://3pooft8s3y.ufs.sh/f/D1wyDGzKuE9VG2CvgZVvaFhitQTcqduZ5oM6RzeyWkr98mpE",
  "https://3pooft8s3y.ufs.sh/f/D1wyDGzKuE9V0BoHqPtv17kVYKRxLTiwecBsQqXlHDFnvoGU",
]

const mockImages = mockUrls.map((url, index) => ({
  id: index + 1,
  url,
}))

export async function Images() {
  return (
    <div className="flex flex-wrap gap-4">
      {mockImages.map((image) => (
        <div key={image.id} className="flex flex-col gap-2">
          <img src={image.url} alt="image" className="flex w-48" />
          <div className="text-sm text-gray-500">{image.name}</div>
        </div>
      ))
      }
    </div>
  );
}

export default async function HomePage() {
  // const posts = await db.query.posts.findMany();

  return (
    <main className="">
      <SignedOut>
        <div className="w-full h-full text-2xl text-center">Please sign in above.</div>
      </SignedOut>
      <SignedIn>
        <Images />
      </SignedIn>
    </main>
  );
}
