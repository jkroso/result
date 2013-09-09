REPORTER=dot

serve: test
	@node_modules/serve/bin/serve -Sloj

test: node_modules
	@ln -f node_modules/result-core/test/result-core.test.js test/result-core.test.js
	@node_modules/mocha/bin/_mocha test/*.test.js \
		--reporter $(REPORTER) \
		--timeout 500 \
		--check-leaks \
		--bail

node_modules: component.json
	@packin install \
		--meta component.json,deps.json \
		--folder node_modules \
		--executables \
		--no-retrace
	
.PHONY: serve test