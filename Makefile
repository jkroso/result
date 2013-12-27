REPORTER=dot

serve: node_modules test/result-core.test.js
	@node_modules/serve/bin/serve -Slojp 0

test: node_modules test/result-core.test.js
	@node_modules/mocha/bin/mocha test/*.test.js \
		--reporter $(REPORTER) \
		--timeout 500 \
		--check-leaks \
		--bail

test/result-core.test.js:
	@curl https://raw.github.com/jkroso/result-core/master/$@ > $@

node_modules: package.json
	@packin install -c \
		--meta package.json \
		--folder node_modules
	
.PHONY: serve test