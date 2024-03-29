#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

#
# Copyright 2019 Joyent, Inc.
# Copyright 2022 MNX Cloud, Inc.
#

#
# Makefile for sdc-system-tests
#

#
# Vars, Tools, Files, Flags
#
NAME		:= sdc-system-tests
JS_FILES	:= $(shell find test -name '*.js' | grep -v '/tmp/')
JSL_CONF_NODE	 = tools/jsl.node.conf
JSL_FILES_NODE	 = $(JS_FILES)
JSSTYLE_FILES	 = $(JS_FILES)
JSSTYLE_FLAGS	 = -f tools/jsstyle.conf

# minimal-64-lts 18.4.0
NODE_PREBUILT_IMAGE=c2c31b00-1d60-11e9-9a77-ff9f06554b0f
ifeq ($(shell uname -s),SunOS)
	NODE_PREBUILT_VERSION=v6.17.0
	NODE_PREBUILT_TAG=gz
else
	NPM	:= $(shell which npm)
endif

ENGBLD_REQUIRE := $(shell git submodule update --init deps/eng)
include ./deps/eng/tools/mk/Makefile.defs
TOP ?= $(error Unable to access eng.git submodule Makefiles.)

ifeq ($(shell uname -s),SunOS)
	include ./deps/eng/tools/mk/Makefile.node_prebuilt.defs
endif

RELEASE_TARBALL	:= $(NAME)-$(STAMP).tgz
RELSTAGEDIR	:= /tmp/$(NAME)-$(STAMP)
DISTCLEAN_FILES	+= node_modules

#
# Targets
#
.PHONY: all
all: | $(NPM_EXEC)
	$(NPM) install
	# Manually get the latest node-sdc-clients.git and build. This is
	# to ensure we get its test suite, which 'npm install sdc-clients'
	# (recently) doesn't include.
	[[ -d node_modules/sdc-clients ]] && (cd node_modules/sdc-clients && git checkout master && git pull) || git clone https://github.com/TritonDataCenter/node-sdc-clients.git node_modules/sdc-clients
	cd node_modules/sdc-clients && $(NPM) install
	# Manually get the latest sdc-designation.git and build. This is
	# to ensure we get its test suite, which 'npm install dapi'
	# (recently) doesn't include.
	[[ -d node_modules/dapi ]] && (cd node_modules/dapi && git checkout master && git pull) || git clone https://github.com/TritonDataCenter/sdc-designation.git node_modules/dapi
	cd node_modules/dapi && $(NPM) install

.PHONY: test
test:
	./runtests.sh

.PHONY: release
release: all
	@echo "Building $(RELEASE_TARBALL)"
	rm -rf $(RELSTAGEDIR)
	mkdir -p $(RELSTAGEDIR)/$(NAME)-$(STAMP)
	cp -r \
		$(TOP)/README.md \
		$(TOP)/package.json \
		$(TOP)/runtests \
		$(TOP)/test \
		$(TOP)/node_modules \
		$(RELSTAGEDIR)/$(NAME)-$(STAMP)/
	rm -rf $(RELSTAGEDIR)/$(NAME)-$(STAMP)/node_modules/sdc-clients/{deps,tools,.git}
	mkdir -p $(RELSTAGEDIR)/$(NAME)-$(STAMP)/build
	cp -r \
		$(TOP)/build/node \
		$(RELSTAGEDIR)/$(NAME)-$(STAMP)/build
	(cd $(RELSTAGEDIR) && pwd && find .)
	(cd $(RELSTAGEDIR) && $(TAR) -I pigz -cf $(TOP)/$(RELEASE_TARBALL) $(NAME)-$(STAMP))
	@rm -rf $(RELSTAGEDIR)

.PHONY: publish
publish: release
	mkdir -p $(ENGBLD_BITS_DIR)/$(NAME)
	cp $(TOP)/$(RELEASE_TARBALL) $(ENGBLD_BITS_DIR)/$(NAME)/$(RELEASE_TARBALL)

.PHONY: dumpvar
dumpvar:
	@if [[ -z "$(VAR)" ]]; then \
		echo "error: set 'VAR' to dump a var"; \
		exit 1; \
	fi
	@echo "$(VAR) is '$($(VAR))'"


include ./deps/eng/tools/mk/Makefile.deps
ifeq ($(shell uname -s),SunOS)
	include ./deps/eng/tools/mk/Makefile.node_prebuilt.targ
endif
include ./deps/eng/tools/mk/Makefile.targ
