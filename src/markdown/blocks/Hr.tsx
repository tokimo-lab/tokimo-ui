export function Hr({ sourceLine }: { sourceLine?: number }) {
  return <hr className="tk-md-hr" data-source-line={sourceLine} />;
}
