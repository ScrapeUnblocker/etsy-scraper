.PHONY: install lint format test run clean

install:
	npm install

lint:
	npm run lint

format:
	npm run format

test:
	npm test

# Usage: make run Q="leather wallet"
run:
	node bin/etsy-scraper.js $(Q)

clean:
	rm -rf node_modules *.csv *.json
