# -*- coding: utf-8 -*-
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
# implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
import logging
import os
import sys

import django

sys.path.insert(0, os.path.abspath('../..'))
sys.path.insert(0, os.path.abspath('.'))

logging.getLogger('openstack_dashboard.settings').setLevel(logging.ERROR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'openstack_dashboard.settings')

django.setup()

# -- General configuration ----------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom ones.
extensions = [
    'openstackdocstheme',
    'sphinx.ext.autodoc',
    'sphinx.ext.coverage',
    'sphinx.ext.todo',
    'sphinx.ext.viewcode',
    'sphinxcontrib.apidoc',
    'sphinxcontrib.rsvgconverter'
]

# autodoc generation is a bit aggressive and a nuisance when doing heavy
# text edit cycles.
# execute "export SPHINX_DEBUG=1" in your terminal to disable

# The suffix of source filenames.
source_suffix = '.rst'

# The master toctree document.
master_doc = 'index'

# General information about the project.
copyright = '2017-2019, OpenStack Foundation'

# If true, '()' will be appended to :func: etc. cross-reference text.
add_function_parentheses = True

# If true, the current module name will be prepended to all description
# unit titles (such as .. function::).
add_module_names = True

# The name of the Pygments (syntax highlighting) style to use.
pygments_style = 'native'

# openstackdocstheme options
openstackdocs_repo_name = 'openstack/octavia-dashboard'
openstackdocs_pdf_link = True
openstackdocs_use_storyboard = True

apidoc_output_dir = 'contributor/modules'
apidoc_module_dir = '../../octavia_dashboard'
apidoc_excluded_paths = [
    'tests',
    'enabled',
    'locale',
    'static',
    'conf',
    'local_settings.d',
    'post_install.sh',
    'karma.conf.js'
]

# -- Options for HTML output --------------------------------------------------

# The theme to use for HTML and HTML Help pages.  Major themes that come with
# Sphinx are currently 'default' and 'sphinxdoc'.
# html_theme_path = ["."]
# html_theme = '_theme'
# html_static_path = ['static']
html_theme = 'openstackdocs'

html_theme_options = {
    'show_other_versions': True
}

html_static_path = []

# Output file base name for HTML help builder.
htmlhelp_basename = 'octavia-dashboarddoc'

# A list of ignored prefixes for module index sorting.
modindex_common_prefix = ['octavia-dashboard.']

# -- Options for LaTeX output -------------------------------------------------

# Fix Unicode character for sphinx_feature_classification
# Sphinx default latex engine (pdflatex) doesn't know much unicode
latex_preamble = r"""
\usepackage{newunicodechar}
\newunicodechar{✖}{\sffamily X}
\setcounter{tocdepth}{2}
\authoraddress{\textcopyright %s OpenStack Foundation}
""" % datetime.datetime.now().year

latex_elements = {
    # The paper size ('letterpaper' or 'a4paper').
    # 'papersize': 'letterpaper',

    # The font size ('10pt', '11pt' or '12pt').
    # 'pointsize': '10pt',

    # Additional stuff for the LaTeX preamble.
    # openany: Skip blank pages in generated PDFs
    'extraclassoptions': 'openany,oneside',
    'makeindex': '',
    'printindex': '',
    'preamble': latex_preamble
}

# Disable usage of xindy https://bugzilla.redhat.com/show_bug.cgi?id=1643664
# Some distros are missing xindy
latex_use_xindy = False

# Fix missing apostrophe
smartquotes_excludes = {'builders': ['latex']}

# Grouping the document tree into LaTeX files. List of tuples
# (source start file, target name, title, author, documentclass
# [howto/manual]).
latex_documents = [(
    'index',
    'doc-octavia-dashboard.tex',
    'Octavia Dashboard Documentation',
    'OpenStack Octavia Team',
    'manual'
)]

# The name of an image file (relative to this directory) to place at the top of
# the title page.
# latex_logo = None

# For "manual" documents, if this is true, then toplevel headings are parts,
# not chapters.
# latex_use_parts = False

# If true, show page references after internal links.
# latex_show_pagerefs = False

# If true, show URL addresses after external links.
# latex_show_urls = False

# Documents to append as an appendix to all manuals.
# latex_appendices = []

# If false, no module index is generated.
latex_domain_indices = False
