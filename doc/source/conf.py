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

import logging
import os
import sys
from sphinx import apidoc

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
    # 'sphinx.ext.intersphinx',
    'sphinx.ext.todo',
    'sphinx.ext.viewcode',
]

# autodoc generation is a bit aggressive and a nuisance when doing heavy
# text edit cycles.
# execute "export SPHINX_DEBUG=1" in your terminal to disable

# The suffix of source filenames.
source_suffix = '.rst'

# The master toctree document.
master_doc = 'index'

# General information about the project.
project = u'octavia-dashboard'
copyright = u'2017, OpenStack Foundation'

# If true, '()' will be appended to :func: etc. cross-reference text.
add_function_parentheses = True

# If true, the current module name will be prepended to all description
# unit titles (such as .. function::).
add_module_names = True

# The name of the Pygments (syntax highlighting) style to use.
pygments_style = 'sphinx'

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
htmlhelp_basename = '%sdoc' % project

# If not '', a 'Last updated on:' timestamp is inserted at every page bottom,
# using the given strftime format.
html_last_updated_fmt = '%Y-%m-%d %H:%M'

# Grouping the document tree into LaTeX files. List of tuples
# (source start file, target name, title, author, documentclass
# [howto/manual]).
latex_documents = [
    ('index',
     '%s.tex' % project,
     u'%s Documentation' % project,
     u'OpenStack Foundation', 'manual'),
]

# Example configuration for intersphinx: refer to the Python standard library.
# intersphinx_mapping = {'http://docs.python.org/': None}

# A list of ignored prefixes for module index sorting.
modindex_common_prefix = ['octavia-dashboard.']

# openstackdocstheme options
repository_name = 'openstack/octavia-dashboard'
bug_project = '909'
bug_tag = 'docs'



# TODO(mordred) We should extract this into a sphinx plugin
def run_apidoc(_):
    cur_dir = os.path.abspath(os.path.dirname(__file__))
    out_dir = os.path.join(cur_dir, 'contributor', 'modules')
    module = os.path.join(cur_dir, '..', '..', 'octavia_dashboard')
    # Keep the order of arguments same as the sphinx-apidoc help, otherwise it
    # would cause unexpected errors:
    # sphinx-apidoc [options] -o <output_path> <module_path>
    # [exclude_pattern, ...]
    apidoc.main([
        '--force',
        '-o',
        out_dir,
        module,
        'octavia_dashboard/tests',
        'octavia_dashboard/enabled',
        'octavia_dashboard/locale',
        'octavia_dashboard/static',
        'octavia_dashboard/post_install.sh',
        'octavia_dashboard/karma.conf.js'
    ])


def setup(app):
    app.connect('builder-inited', run_apidoc)
