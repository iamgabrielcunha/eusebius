.PHONY: dev build-data test validate

dev:
	pnpm --filter @eusebius/web dev

build-data: validate
	pnpm --filter @eusebius/loader run load

validate:
	pnpm --filter @eusebius/loader run validate

test:
	pnpm run test --recursive
