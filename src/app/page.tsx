import Link from "next/link";

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

export default function HomePage() {
  return (
    <main className="">
      <div className="flex flex-wrap gap-4">{
        mockImages.map((image) => (
          <div key={image.id} className="w-48">
            <img src={image.url} alt="iamge" />
          </div>
        ))
      }
      </div>
    </main>
  );
}
