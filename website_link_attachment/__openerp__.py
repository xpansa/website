# -*- coding: utf-8 -*-
#
#    Link Attachment in Website
#    Copyright (C) 2014 Xpansa Group (<http://xpansa.com>).
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
{
    'name': 'Link Attachment in Website',
    'version': '0.1',
    'author': 'Xpansa Group',
    'website': 'http://xpansa.com',
    'description': """
Link Attachment in Website
=====================================
This module extends website's media dialog by adding a new tab - 'File'. 
In the 'File' tab its allows to upload files from computer to odoo,
and include a link into the website or copy the link and share it elsewhere.
All files are stored as an Odoo attachments and can be selected multiple times.
All files uploaded via this module is publicly available, no restrictions are set.
""",
    'summary': 'Includes a "File" tab in media dialog for linking a file',
    'depends': [
        'website'
    ],
    'data': [
        'views/assets.xml',
        'views/views.xml'
    ],
    'installable': True,
    'auto_install': False,
}
