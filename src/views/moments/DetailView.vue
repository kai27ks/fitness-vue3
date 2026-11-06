<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, getRole } from '../../api'
import { toast } from '../../utils'
import NavBar from '../../components/NavBar.vue'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const detail = ref<any>(null)
const content = ref('')
const replyTo = ref<any>(null)
const sending = ref(false)

async function load() {
  try { detail.value = await api.momentDetail(id) }
  catch (e: any) { if (e.message !== '登录已过期') toast(e.message) }
}

function startReply(c: any, rootId: number) {
  replyTo.value = { name: c.authorName, parentId: c.id, rootId }
}

async function send() {
  const text = content.value.trim()
  if (!text || sending.value) return
  sending.value = true
  try {
    await api.addMomentComment(id, {
      content: text,
      parentId: replyTo.value?.parentId || null,
      rootId: replyTo.value?.rootId || null
    })
    content.value = ''
    replyTo.value = null
    await load()
  } catch (e: any) { toast(e.message) }
  finally { sending.value = false }
}

async function removeComment(c: any) {
  if (!confirm('删除这条评论？')) return
  try { await api.deleteMomentComment(c.id); toast('已删除'); load() }
  catch (e: any) { toast(e.message) }
}

async function removeMedia() {
  if (!confirm('确定删除这张图片吗？')) return
  try { await api.deleteMoment(id); toast('已删除'); router.replace('/moments/mine') }
  catch (e: any) { toast(e.message) }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <NavBar title="图片详情" :right="detail?.media?.mine || getRole() === 'ADMIN' ? '删除' : ''" @right="removeMedia" />

    <template v-if="detail">
      <img class="mom-big" :src="detail.media.url" :alt="detail.media.title || '训练瞬间'" />
      <div class="up-card" style="margin:12px 16px">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="avatar" style="background:var(--grad);color:#fff">{{ (detail.media.authorName || '会')[0] }}</span>
          <div style="flex:1">
            <b style="font-size:14px">{{ detail.media.authorName }}</b>
            <small style="display:block;color:var(--sub);font-size:11px">{{ detail.media.createTime }}</small>
          </div>
          <span class="status-pill" :class="detail.media.status.toLowerCase()">
            {{ { PENDING: '审核中', APPROVED: '已发布', REJECTED: '已驳回' }[detail.media.status] }}
          </span>
        </div>
        <p v-if="detail.media.title" style="font-size:14px;line-height:1.7;margin:12px 0 0">{{ detail.media.title }}</p>
        <small style="color:var(--sub);font-size:11px;display:block;margin-top:8px">
          {{ detail.media.width }}×{{ detail.media.height }} · 压缩后 {{ (detail.media.outputSize / 1024).toFixed(0) }} KB
        </small>
      </div>

      <div class="cmt-sec" style="margin:12px 16px 80px">
        <h4>评论 {{ detail.totalComments }}</h4>
        <div v-if="!detail.comments.length" class="mom-empty" style="padding:24px 0">还没有评论，来抢沙发吧</div>
        <div v-for="g in detail.comments" :key="g.root.id" class="cmt-group">
          <div class="cmt">
            <span class="avatar" style="background:#EAF0FF;color:#4E8CFF">{{ (g.root.authorName || '用')[0] }}</span>
            <div class="body">
              <span class="n">{{ g.root.authorName }}</span><span class="t">{{ g.root.createTime?.slice(5, 16) }}</span>
              <p>{{ g.root.content }}</p>
              <div class="op">
                <a href="javascript:;" @click="startReply(g.root, g.root.id)">回复</a>
                <a href="javascript:;" v-if="g.root.mine || getRole() === 'ADMIN'" @click="removeComment(g.root)">删除</a>
              </div>
            </div>
          </div>
          <!-- 楼中楼：对回复再回复仍挂同一楼层，显示「A 回复 B」 -->
          <div class="cmt-replies" v-if="g.replies.length">
            <div v-for="r in g.replies" :key="r.id" class="cmt">
              <span class="avatar" style="background:#E6F8F1;color:#0BA678">{{ (r.authorName || '用')[0] }}</span>
              <div class="body">
                <span class="n">{{ r.authorName }}</span>
                <span class="reply-to" v-if="r.replyToName"> 回复 {{ r.replyToName }}</span>
                <span class="t">{{ r.createTime?.slice(5, 16) }}</span>
                <p>{{ r.content }}</p>
                <div class="op">
                  <a href="javascript:;" @click="startReply(r, g.root.id)">回复</a>
                  <a href="javascript:;" v-if="r.mine || getRole() === 'ADMIN'" @click="removeComment(r)">删除</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="composer">
        <div style="flex:1">
          <div class="composer-hint" v-if="replyTo">
            回复 @{{ replyTo.name }} <a href="javascript:;" @click="replyTo = null" style="color:var(--sub)">取消</a>
          </div>
          <input v-model="content" maxlength="200" placeholder="说点什么…" @keyup.enter="send" />
        </div>
        <button class="btn" :disabled="sending || !content.trim()" @click="send">发送</button>
      </div>
    </template>
  </div>
</template>
