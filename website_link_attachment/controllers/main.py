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
import json
import base64
import urllib2
from openerp import http
from openerp.http import request


class WebsiteLinkAttachment(http.Controller):

    @http.route('/website/attach_file', type='http', auth='user', methods=['POST'], website=True)
    def attach(self, func, upload=None):
        Attachments = request.env['ir.attachment']

        message = None
        try:
            doc_data = upload.read()

            attachment_id = Attachments.create({
                'name': upload.filename,
                'datas': doc_data.encode('base64'),
                'datas_fname': upload.filename,
                'res_model': 'ir.ui.view',
                'available_in_editor': True
            })

        except Exception, e:
            logger.exception("Failed to upload doc to attachment")
            message = unicode(e)

        return """<script type='text/javascript'>
            window.parent['%s'](%s, %s);
        </script>""" % (func, json.dumps(attachment_id.id), json.dumps(message))

    @http.route(['/website/download_file/<attachment_id>'], type='http', auth="public", website=True)
    def download_file(self, attachment_id=None):
        if not attachment_id:
            return request.not_found()
        attachment = request.env['ir.attachment'].sudo().search([('id', '=', attachment_id), ('available_in_editor', '=', True)])

        if not attachment:
            return request.render('website.404', {})

        filecontent = base64.b64decode(attachment.datas or '')
        if not filecontent:
            return request.not_found()
        else:
            filename = attachment.datas_fname or 'filedownload'
            return request.make_response(filecontent,
                                         [('Content-Type', 'application/octet-stream'),
                                          ('Content-Disposition', content_disposition(filename))])


def content_disposition(filename):
    filename = filename.encode('utf8')
    escaped = urllib2.quote(filename)
    browser = request.httprequest.user_agent.browser
    version = int(
        (request.httprequest.user_agent.version or '0').split('.')[0])
    if browser == 'msie' and version < 9:
        return "attachment; filename=%s" % escaped
    elif browser == 'safari':
        return "attachment; filename=%s" % filename
    else:
        return "attachment; filename*=UTF-8''%s" % escaped
