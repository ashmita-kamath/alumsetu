import Spinner from "./Spinner";

/** A large spinner centred in the page, used while a page loads its data. */
export default function PageLoader() {
  return (
    <div className="flex justify-center py-24">
      <Spinner size="lg" />
    </div>
  );
}
