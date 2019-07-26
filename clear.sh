
set -x
set -e

(cd migrations && node recreate-db.js dangerous)

make mrun