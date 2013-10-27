REPORTER=dot

serve: node_modules test/result-core.test.js
	@node_modules/serve/bin/serve -Sloj

test: node_modules component.json
	@node_modules/mocha/bin/_mocha test/*.test.js \
		--reporter $(REPORTER) \
		--timeout 500 \
		--check-leaks \
		--bail

test/result-core.test.js:
	@curl https://raw.github.com/jkroso/result-core/master/$@ > $@

node_modules: *.json
	@packin install \
		--meta deps.json,package.json,component.json \
		--folder node_modules \
		--executables \
		--no-retrace
	
.PHONY: serve test